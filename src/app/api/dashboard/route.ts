import { db } from "@/db"; import { contacts, companies, deals, activities, invoices, products, payments, paymentAllocations, creditNotes, expenses, projects, quotations, contracts } from "@/db/schema"; import { eq, count, sum, sql, desc, and, gte } from "drizzle-orm"; import { getCurrentUser, unauthorized, ok } from "@/lib/auth";
export async function GET(){ const u=await getCurrentUser(); if(!u) return unauthorized();
 const [[tc],[tcomp],[td],[ta],[ti],[tp]]=await Promise.all([db.select({v:count()}).from(contacts),db.select({v:count()}).from(companies),db.select({v:count()}).from(deals),db.select({v:count()}).from(activities),db.select({v:count()}).from(invoices),db.select({v:count()}).from(products)]);
 const [rev]=await db.select({v:sum(deals.value)}).from(deals).where(eq(deals.stage,"won"));
 const [pipe]=await db.select({v:sum(deals.value)}).from(deals).where(sql`${deals.stage} not in ('won','lost')`);
 const [paid]=await db.select({v:sum(payments.amount)}).from(payments).where(sql`${payments.status} not in ('failed','refunded')`);
 const invRows=await db.select().from(invoices); const { invoiceBalance } = await import("@/lib/finance"); let receivables=0, collectedAlloc=0; for(const inv of invRows){ const bal=await invoiceBalance(inv.id); if(bal&&inv.status!=="cancelled"){ receivables+=bal.outstanding; collectedAlloc+=bal.paidAmount; } }
 const [expTotal]=await db.select({v:sum(expenses.amount)}).from(expenses).where(sql`${expenses.status} in ('approved','paid','reimbursed')`);
 const [[tproj],[tquo],[tcon],[tpay]]=await Promise.all([db.select({v:count()}).from(projects),db.select({v:count()}).from(quotations),db.select({v:count()}).from(contracts),db.select({v:count()}).from(payments)]);
 const byStage=await db.select({stage:deals.stage,c:count(),v:sum(deals.value)}).from(deals).groupBy(deals.stage);
 const byStatus=await db.select({status:contacts.status,c:count()}).from(contacts).groupBy(contacts.status);
 const recentDeals=await db.select().from(deals).orderBy(desc(deals.createdAt)).limit(5);
 const recentContacts=await db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(5);
 const upcoming=await db.select().from(activities).where(and(eq(activities.completed,false),sql`${activities.dueDate} is not null`)).orderBy(activities.dueDate).limit(8);
 const overdue=await db.select().from(activities).where(and(eq(activities.completed,false),sql`${activities.dueDate} < now()`));
 const wonCount=byStage.find(s=>s.stage==="won")?.c||0; const lostCount=byStage.find(s=>s.stage==="lost")?.c||0;
 const monthly=await db.execute(sql`select to_char(created_at,'Mon YYYY') as month, count(*)::int as deals, coalesce(sum(value),0) as value from deals group by to_char(created_at,'Mon YYYY'), date_trunc('month',created_at) order by date_trunc('month',created_at) desc limit 6`);
 return ok({stats:{totalContacts:tc.v,totalCompanies:tcomp.v,totalDeals:td.v,totalActivities:ta.v,totalInvoices:ti.v,totalProducts:tp.v,revenue:Number(rev.v||0),pipelineValue:Number(pipe.v||0),paidInvoices:Number(collectedAlloc||0), collectedPayments:Number(paid.v||0), receivables, totalExpenses:Number(expTotal.v||0), totalProjects:tproj.v, totalQuotations:tquo.v, totalContracts:tcon.v, totalPayments:tpay.v,winRate:(wonCount+lostCount)>0?Math.round(wonCount/(wonCount+lostCount)*100):0,overdueTasks:overdue.length},byStage,byStatus,recentDeals,recentContacts,upcoming,monthly:monthly.rows});
}
