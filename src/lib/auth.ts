import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SECRET = process.env.AUTH_SECRET || process.env.DATABASE_URL || "nexus-crm-secret-key-2026-change-in-prod";
export const COOKIE = "nexus_session";

export async function hashPassword(p: string) { return bcrypt.hash(p, 10); }
export async function verifyPassword(p: string, h: string) { return bcrypt.compare(p, h); }

export function signToken(userId: string, sessionVersion=1) {
  const payload = `${userId}.${Date.now() + 1000 * 60 * 60 * 24 * 7}.${sessionVersion}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}
export function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(".");
    if (parts.length !== 4) return null;
    const [userId, exp, version, sig] = parts;
    if (Date.now() > Number(exp)) return null;
    const expected = createHmac("sha256", SECRET).update(`${userId}.${exp}.${version}`).digest("hex");
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return userId;
  } catch { return null; }
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const decodedRaw = Buffer.from(token, "base64url").toString(); const tokenVersion = Number(decodedRaw.split(".")[2]||1);
  const userId = verifyToken(token);
  if (!userId) return null;
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, phone: users.phone, isActive: users.isActive, mfaEnabled: users.mfaEnabled, sessionVersion: users.sessionVersion, createdAt: users.createdAt }).from(users).where(eq(users.id, userId));
  if (!user || !user.isActive) return null;
  if ((user.sessionVersion||1) !== tokenVersion) return null; // password reset / security action invalidates old sessions
  return user;
}
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    const error: any = new Error("Unauthorized. Please login.");
    error.status = 401;
    throw error;
  }
  return user;
}

export function unauthorized() { return Response.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 }); }
export function err(msg: string, status = 400) { return Response.json({ success: false, error: msg }, { status }); }
export function ok(data: unknown, status = 200) { return Response.json({ success: true, data }, { status }); }

export function signMfaToken(userId:string){ const payload=`mfa.${userId}.${Date.now()+1000*60*10}`; const sig=createHmac("sha256",SECRET).update(payload).digest("hex"); return Buffer.from(`${payload}.${sig}`).toString("base64url"); }
export function verifyMfaToken(token:string):string|null{ try{ const d=Buffer.from(token,"base64url").toString(); const p=d.split("."); if(p.length!==4||p[0]!=="mfa") return null; const [,userId,exp,sig]=p; if(Date.now()>Number(exp)) return null; const expSig=createHmac("sha256",SECRET).update(`mfa.${userId}.${exp}`).digest("hex"); if(sig.length!==expSig.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expSig))) return null; return userId; }catch{ return null; } }
export function sessionCookie(token:string){ return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV==="production"?"Secure; ":""}Max-Age=${60*60*24*7}`; }
