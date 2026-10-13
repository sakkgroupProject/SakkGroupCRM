import nodemailer from "nodemailer"; import { db } from "@/db"; import { emailOutbox } from "@/db/schema"; import { eq } from "drizzle-orm";
export function emailConfigured(){ return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS); }
export async function queueEmail(to:string, subject:string, body:string){
  const [row]=await db.insert(emailOutbox).values({toEmail:to,subject,body,status:"queued"}).returning();
  if(emailConfigured()){
    try{ const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==="true",auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
      const info=await transporter.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to,subject,html:body});
      await db.update(emailOutbox).set({status:"sent",providerId:info.messageId,attempts:1,sentAt:new Date()}).where(eq(emailOutbox.id,row.id)); return {...row,status:"sent"};
    }catch(e:any){ await db.update(emailOutbox).set({status:"failed",error:String(e?.message||e),attempts:1}).where(eq(emailOutbox.id,row.id)); return {...row,status:"failed"}; }
  }
  return row; // queued in outbox until SMTP configured — visible/retryable, never faked as sent
}
export async function retryOutbox(limit=20){ const rows=await db.select().from(emailOutbox).where(eq(emailOutbox.status,"queued")); let sent=0; for(const r of rows.slice(0,limit)){ const res:any=await queueEmail(r.toEmail,r.subject,r.body).catch(()=>null); if(res?.status==="sent") sent++; } return {queued:rows.length,sent,configured:emailConfigured()}; }
