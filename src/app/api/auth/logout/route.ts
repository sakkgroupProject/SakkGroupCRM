import { COOKIE, ok } from "@/lib/auth";
export async function POST(){ const res=ok({message:"Logged out"}); res.headers.set("Set-Cookie",`${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`); return res; }
