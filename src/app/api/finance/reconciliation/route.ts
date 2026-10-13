import { db } from "@/db";
import { bankTransactions, invoices, payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAuth();

    const [txs, allInvoices, allPayments] = await Promise.all([
      db.select().from(bankTransactions).orderBy(desc(bankTransactions.statementDate)).limit(100),
      db.select().from(invoices),
      db.select().from(payments),
    ]);

    const totalBankDeposits = txs.filter((t) => t.type === "credit").reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const reconciledCount = txs.filter((t) => t.status === "reconciled").length;
    const matchedCount = txs.filter((t) => t.status === "matched").length;
    const unmatchedCount = txs.filter((t) => t.status === "unmatched").length;

    return Response.json({
      success: true,
      items: txs,
      summary: {
        totalTransactions: txs.length,
        totalDeposits: totalBankDeposits,
        reconciledCount,
        matchedCount,
        unmatchedCount,
      },
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin" && user.role !== "manager" && user.role !== "finance") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, transactions, transactionId, status } = body;

    if (action === "reconcile_item") {
      if (!transactionId) {
        return Response.json({ success: false, error: "transactionId required" }, { status: 400 });
      }
      await db
        .update(bankTransactions)
        .set({ status: status || "reconciled" })
        .where(eq(bankTransactions.id, transactionId));
      return Response.json({ success: true, message: `Transaction updated to ${status || "reconciled"}` });
    }

    // Default: Batch Import from Bank Statement (CSV)
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return Response.json({ success: false, error: "Array of transactions required" }, { status: 400 });
    }

    const [allInvoices, allPayments] = await Promise.all([
      db.select().from(invoices),
      db.select().from(payments),
    ]);

    let imported = 0;
    let autoMatched = 0;

    for (const raw of transactions) {
      const amt = Math.abs(Number(raw.amount || 0));
      const descText = String(raw.description || "Bank Entry").trim();
      const dateVal = raw.date ? String(raw.date).slice(0, 10) : new Date().toISOString().slice(0, 10);
      const isCredit = (raw.type || "credit").toLowerCase() === "credit" || Number(raw.amount) > 0;

      // Smart Auto-Matching against Invoices
      let matchedInvId: string | null = null;
      let matchedPayId: string | null = null;
      let matchStatus = "unmatched";

      const invoiceMatch = allInvoices.find(
        (i) => Math.abs(Number(i.amount || 0) * (i.quantity || 1) - amt) < 0.01 && (i.status === "sent" || i.status === "paid")
      );
      if (invoiceMatch) {
        matchedInvId = invoiceMatch.id;
        matchStatus = "matched";
        autoMatched++;
      } else {
        const paymentMatch = allPayments.find((p) => Math.abs(Number(p.amount || 0) - amt) < 0.01);
        if (paymentMatch) {
          matchedPayId = paymentMatch.id;
          matchStatus = "matched";
          autoMatched++;
        }
      }

      await db.insert(bankTransactions).values({
        statementDate: dateVal,
        description: descText,
        amount: amt.toFixed(2),
        type: isCredit ? "credit" : "debit",
        reference: raw.reference || null,
        matchedInvoiceId: matchedInvId,
        matchedPaymentId: matchedPayId,
        status: matchStatus,
      });

      imported++;
    }

    return Response.json({
      success: true,
      message: `Imported ${imported} bank statement lines (${autoMatched} automatically matched with CRM invoices/payments)`,
      imported,
      autoMatched,
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
