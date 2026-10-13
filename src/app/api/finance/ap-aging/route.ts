import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { expenses, vendors } from "@/db/schema";
import { eq, or, inArray } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

function ok(data: any) {
  return Response.json({ success: true, ...data });
}
function err(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  // Unpaid approved or submitted expenses
  const unpaid = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      vendorId: expenses.vendorId,
      category: expenses.category,
      amount: expenses.amount,
      currency: expenses.currency,
      status: expenses.status,
      expenseDate: expenses.expenseDate,
      createdAt: expenses.createdAt,
      vendorName: vendors.name,
    })
    .from(expenses)
    .leftJoin(vendors, eq(expenses.vendorId, vendors.id))
    .where(or(eq(expenses.status, "approved"), eq(expenses.status, "submitted")));

  const now = Date.now();
  const buckets = {
    current_0_30: 0,
    aging_31_60: 0,
    aging_61_90: 0,
    over_90: 0,
    totalPayable: 0,
  };

  const categorizedItems = unpaid.map((item) => {
    const itemDate = item.expenseDate ? new Date(item.expenseDate).getTime() : new Date(item.createdAt).getTime();
    const ageDays = Math.max(0, Math.floor((now - itemDate) / (1000 * 60 * 60 * 24)));
    const amt = Number(item.amount || 0);
    buckets.totalPayable += amt;

    let bucket = "0-30 days";
    if (ageDays <= 30) {
      buckets.current_0_30 += amt;
    } else if (ageDays <= 60) {
      buckets.aging_31_60 += amt;
      bucket = "31-60 days";
    } else if (ageDays <= 90) {
      buckets.aging_61_90 += amt;
      bucket = "61-90 days";
    } else {
      buckets.over_90 += amt;
      bucket = "90+ days";
    }

    return {
      ...item,
      ageDays,
      bucket,
    };
  });

  return ok({
    summary: buckets,
    items: categorizedItems,
  });
}

// Batch Reimbursement Payout Action
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const { expenseIds = [], batchReference } = body;

  if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
    return err("Array of expenseIds required");
  }

  const batchRef = batchReference || `REIMB-${Date.now().toString(36).toUpperCase()}`;

  await db
    .update(expenses)
    .set({
      status: "reimbursed",
      notes: `Batch payout ref: ${batchRef}`,
      updatedAt: new Date(),
    })
    .where(inArray(expenses.id, expenseIds));

  await logAudit(user.id, "expenses.batch_reimburse", "expense", undefined, `Reimbursed ${expenseIds.length} expenses under batch ${batchRef}`);
  return ok({ message: `Successfully marked ${expenseIds.length} expense(s) as reimbursed`, batchRef });
}
