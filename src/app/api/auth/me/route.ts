import { getCurrentUser, unauthorized, err, ok } from "@/lib/auth";
import { db } from "@/db"; import { users } from "@/db/schema"; import { eq } from "drizzle-orm";
export async function GET(){ const u=await getCurrentUser(); if(!u) return unauthorized(); return ok(u); }
export async function PUT(req: Request){ const u=await getCurrentUser(); if(!u) return unauthorized(); const body=await req.json(); // P0 fix: users cannot change their own role (privilege escalation). Role changes only via admin Team API.
 const role = u.role==="admin" && body.role ? body.role : u.role;
 const [upd]=await db.update(users).set({name:body.name??u.name, phone:body.phone??u.phone, role, updatedAt:new Date()}).where(eq(users.id,u.id)).returning({id:users.id,name:users.name,email:users.email,role:users.role,phone:users.phone,createdAt:users.createdAt}); return ok(upd); }
