import { db } from "@/db";
import { contacts, companies, deals, activities, invoices, products, payments, expenses, projects, quotations, contracts, leadSubmissions } from "@/db/schema";
import { eq, count, sum, sql, desc, and } from "drizzle-orm";
import { getCurrentUser, unauthorized, ok } from "@/lib/auth";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return unauthorized();

  const [[tc], [tcomp], [td], [ta], [ti], [tp], [tLeadSub]] = await Promise.all([
    db.select({ v: count() }).from(contacts),
    db.select({ v: count() }).from(companies),
    db.select({ v: count() }).from(deals),
    db.select({ v: count() }).from(activities),
    db.select({ v: count() }).from(invoices),
    db.select({ v: count() }).from(products),
    db.select({ v: count() }).from(leadSubmissions),
  ]);

  const [rev] = await db.select({ v: sum(deals.value) }).from(deals).where(eq(deals.stage, "won"));
  const [pipe] = await db.select({ v: sum(deals.value) }).from(deals).where(sql`${deals.stage} not in ('won','lost')`);
  const [paid] = await db.select({ v: sum(payments.amount) }).from(payments).where(sql`${payments.status} not in ('failed','refunded')`);

  const invRows = await db.select().from(invoices);
  const { invoiceBalance } = await import("@/lib/finance");
  let receivables = 0, collectedAlloc = 0;
  for (const inv of invRows) {
    const bal = await invoiceBalance(inv.id);
    if (bal && inv.status !== "cancelled") {
      receivables += bal.outstanding;
      collectedAlloc += bal.paidAmount;
    }
  }

  const [expTotal] = await db.select({ v: sum(expenses.amount) }).from(expenses).where(sql`${expenses.status} in ('approved','paid','reimbursed')`);
  const [[tproj], [tquo], [tcon], [tpay]] = await Promise.all([
    db.select({ v: count() }).from(projects),
    db.select({ v: count() }).from(quotations),
    db.select({ v: count() }).from(contracts),
    db.select({ v: count() }).from(payments),
  ]);

  const byStage = await db.select({ stage: deals.stage, c: count(), v: sum(deals.value) }).from(deals).groupBy(deals.stage);
  const byStatus = await db.select({ status: contacts.status, c: count() }).from(contacts).groupBy(contacts.status);
  const recentDeals = await db.select().from(deals).orderBy(desc(deals.createdAt)).limit(5);
  const recentContacts = await db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(5);
  const upcoming = await db.select().from(activities).where(and(eq(activities.completed, false), sql`${activities.dueDate} is not null`)).orderBy(activities.dueDate).limit(8);
  const overdue = await db.select().from(activities).where(and(eq(activities.completed, false), sql`${activities.dueDate} < now()`));

  const wonCount = byStage.find((s) => s.stage === "won")?.c || 0;
  const lostCount = byStage.find((s) => s.stage === "lost")?.c || 0;

  // Real 6-month rolling revenue aggregation from invoices and won deals
  const now = new Date();
  const monthsMap = new Map<string, { month: string; label: string; revenue: number; dealsCount: number; invoicesCount: number }>();
  const monthsKeys: string[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const month = d.toLocaleString("en-US", { month: "short" });
    const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
    monthsMap.set(key, { month, label, revenue: 0, dealsCount: 0, invoicesCount: 0 });
    monthsKeys.push(key);
  }

  try {
    const invRevByMonth = await db.execute<{ month_key: string; rev: string; cnt: number }>(
      sql`select to_char(coalesce(issued_date, created_at::date), 'YYYY-MM') as month_key, coalesce(sum(amount), 0)::text as rev, count(*)::int as cnt from ${invoices} where status != 'cancelled' group by 1`
    );
    for (const r of invRevByMonth.rows) {
      if (monthsMap.has(r.month_key)) {
        const item = monthsMap.get(r.month_key)!;
        item.revenue += Number(r.rev || 0);
        item.invoicesCount += Number(r.cnt || 0);
      }
    }

    const wonDealsByMonth = await db.execute<{ month_key: string; rev: string; cnt: number }>(
      sql`select to_char(created_at, 'YYYY-MM') as month_key, coalesce(sum(value), 0)::text as rev, count(*)::int as cnt from ${deals} where stage = 'won' group by 1`
    );
    for (const r of wonDealsByMonth.rows) {
      if (monthsMap.has(r.month_key)) {
        const item = monthsMap.get(r.month_key)!;
        item.revenue += Number(r.rev || 0);
        item.dealsCount += Number(r.cnt || 0);
      }
    }
  } catch { }

  const revenueByMonth = monthsKeys.map((k) => monthsMap.get(k)!);
  const prevRev = revenueByMonth[4]?.revenue || 0;
  const currRev = revenueByMonth[5]?.revenue || 0;
  const revenueGrowth = prevRev > 0 ? Math.round(((currRev - prevRev) / prevRev) * 100) : (currRev > 0 ? 100 : 0);

  // Real pipeline stage conversion funnel
  const rawLeadCount = Number(tLeadSub.v || 0) + (byStatus.find((s) => s.status === "lead")?.c || 0);
  const dealStageMap: Record<string, { c: number; v: number }> = {};
  for (const s of byStage) {
    dealStageMap[s.stage] = { c: Number(s.c || 0), v: Number(s.v || 0) };
  }

  const leadCaptureTotal = rawLeadCount + (dealStageMap["lead"]?.c || 0);
  const qualifiedTotal = (dealStageMap["qualified"]?.c || 0) + (byStatus.find((s) => s.status === "prospect")?.c || 0);
  const proposalTotal = (dealStageMap["proposal"]?.c || 0) + tquo.v;
  const negotiationTotal = (dealStageMap["negotiation"]?.c || 0) + tcon.v;
  const wonTotal = (dealStageMap["won"]?.c || 0) + ti.v;

  const totalFunnelVolume = leadCaptureTotal + qualifiedTotal + proposalTotal + negotiationTotal + wonTotal;
  const maxFunnelCount = Math.max(1, leadCaptureTotal, qualifiedTotal, proposalTotal, negotiationTotal, wonTotal);

  const funnelStages = [
    {
      stage: "Lead Capture",
      count: leadCaptureTotal,
      value: dealStageMap["lead"]?.v || 0,
      percent: totalFunnelVolume > 0 ? Math.round((leadCaptureTotal / maxFunnelCount) * 100) : 0,
      color: "bg-slate-400",
    },
    {
      stage: "Qualified Prospect",
      count: qualifiedTotal,
      value: dealStageMap["qualified"]?.v || 0,
      percent: totalFunnelVolume > 0 ? Math.round((qualifiedTotal / maxFunnelCount) * 100) : 0,
      color: "bg-sky-500",
    },
    {
      stage: "Proposal & Quotation",
      count: proposalTotal,
      value: dealStageMap["proposal"]?.v || 0,
      percent: totalFunnelVolume > 0 ? Math.round((proposalTotal / maxFunnelCount) * 100) : 0,
      color: "bg-indigo-500",
    },
    {
      stage: "Contract Negotiation",
      count: negotiationTotal,
      value: dealStageMap["negotiation"]?.v || 0,
      percent: totalFunnelVolume > 0 ? Math.round((negotiationTotal / maxFunnelCount) * 100) : 0,
      color: "bg-amber-500",
    },
    {
      stage: "Closed Won Deal",
      count: wonTotal,
      value: (dealStageMap["won"]?.v || 0) + Number(rev.v || 0),
      percent: totalFunnelVolume > 0 ? Math.round((wonTotal / maxFunnelCount) * 100) : 0,
      color: "bg-emerald-500",
    },
  ];

  const monthly = await db.execute(
    sql`select to_char(created_at,'Mon YYYY') as month, count(*)::int as deals, coalesce(sum(value),0) as value from ${deals} group by to_char(created_at,'Mon YYYY'), date_trunc('month',created_at) order by date_trunc('month',created_at) desc limit 6`
  );

  return ok({
    stats: {
      totalContacts: tc.v,
      totalCompanies: tcomp.v,
      totalDeals: td.v,
      totalActivities: ta.v,
      totalInvoices: ti.v,
      totalProducts: tp.v,
      revenue: Number(rev.v || 0),
      pipelineValue: Number(pipe.v || 0),
      paidInvoices: Number(collectedAlloc || 0),
      collectedPayments: Number(paid.v || 0),
      receivables,
      totalExpenses: Number(expTotal.v || 0),
      totalProjects: tproj.v,
      totalQuotations: tquo.v,
      totalContracts: tcon.v,
      totalPayments: tpay.v,
      winRate: (wonCount + lostCount) > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0,
      overdueTasks: overdue.length,
    },
    byStage,
    byStatus,
    recentDeals,
    recentContacts,
    upcoming,
    monthly: monthly.rows,
    revenueByMonth,
    revenueGrowth,
    funnelStages,
  });
}
