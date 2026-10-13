import { db } from "@/db"; import { invoices, paymentAllocations, payments, creditNotes } from "@/db/schema"; import { eq, and, sql } from "drizzle-orm"; import { round2 } from "./audit";
export function invoiceTotal(inv:{amount:unknown,quantity:number,taxRate:unknown}){ return round2(Number(inv.amount||0)*Number(inv.quantity||1)*(1+Number(inv.taxRate||0)/100)); }
export async function invoiceBalance(invoiceId:string, executor:any=db){
  const [inv]=await executor.select().from(invoices).where(eq(invoices.id,invoiceId)); if(!inv) return null;
  const total=invoiceTotal(inv);
  const paidRows=await executor.select({a:paymentAllocations.amount}).from(paymentAllocations).innerJoin(payments,eq(paymentAllocations.paymentId,payments.id)).where(and(eq(paymentAllocations.invoiceId,invoiceId), sql`${payments.status} not in ('failed','refunded')`));
  const paid=round2(paidRows.reduce((s:number,r:any)=>s+Number(r.a),0));
  const credits=await executor.select().from(creditNotes).where(and(eq(creditNotes.invoiceId,invoiceId),eq(creditNotes.status,"applied")));
  const credit=round2(credits.reduce((s:number,r:any)=>s+Number(r.amount),0));
  const outstanding=round2(Math.max(0,total-paid-credit));
  const derivedStatus= inv.status==="cancelled" ? "cancelled" : outstanding<=0&&total>0 ? "paid" : paid+credit>0 ? "partially_paid" : inv.status;
  return { invoice:inv, total, paidAmount:paid, creditAmount:credit, outstanding, derivedStatus };
}
