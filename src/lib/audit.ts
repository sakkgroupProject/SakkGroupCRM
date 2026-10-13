import { db } from "@/db"; import { auditLogs, notifications } from "@/db/schema";
export async function logAudit(userId:string|null, action:string, entityType?:string, entityId?:string, details?:string){ try{ await db.insert(auditLogs).values({userId:userId||null,action,entityType:entityType||null,entityId:entityId||null,details:details||null}); }catch{} }
export async function notifyUser(userId:string, title:string, message?:string, type="info", entityType?:string, entityId?:string){ if(!userId) return; try{ await db.insert(notifications).values({userId,title,message:message||null,type,entityType:entityType||null,entityId:entityId||null}); }catch{} }
export const round2=(n:number)=>Math.round((Number(n)+Number.EPSILON)*100)/100;
