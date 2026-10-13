import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { contacts, activities, deals, quotations, invoices, payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function ok(data: any) {
  return Response.json({ success: true, ...data });
}
function err(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const { id } = await params;
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!contact) return err("Contact not found", 404);

  const [actList, dealList, quoteList, invList, payList] = await Promise.all([
    db.select().from(activities).where(eq(activities.contactId, id)).orderBy(desc(activities.createdAt)),
    db.select().from(deals).where(eq(deals.contactId, id)).orderBy(desc(deals.createdAt)),
    db.select().from(quotations).where(eq(quotations.contactId, id)).orderBy(desc(quotations.createdAt)),
    db.select().from(invoices).where(eq(invoices.contactId, id)).orderBy(desc(invoices.createdAt)),
    db.select().from(payments).where(eq(payments.contactId, id)).orderBy(desc(payments.createdAt)),
  ]);

  // Combine into unified timeline
  const timeline: Array<{
    id: string;
    type: "activity" | "deal" | "quotation" | "invoice" | "payment";
    title: string;
    subtitle: string;
    date: Date | string;
    status?: string;
    amount?: string | number;
  }> = [];

  for (const a of actList) {
    timeline.push({
      id: a.id,
      type: "activity",
      title: `${a.type.toUpperCase()}: ${a.title}`,
      subtitle: a.description || "Activity recorded",
      date: a.dueDate || a.createdAt,
      status: a.completed ? "completed" : "pending",
    });
  }

  for (const d of dealList) {
    timeline.push({
      id: d.id,
      type: "deal",
      title: `DEAL: ${d.title}`,
      subtitle: `Stage: ${d.stage} (${d.probability}%)`,
      date: d.createdAt,
      status: d.stage,
      amount: `${d.value} ${d.currency}`,
    });
  }

  for (const q of quoteList) {
    timeline.push({
      id: q.id,
      type: "quotation",
      title: `QUOTE: ${q.quoteNumber} — ${q.title}`,
      subtitle: `Total: ${q.total} ${q.currency}`,
      date: q.createdAt,
      status: q.status,
      amount: `${q.total} ${q.currency}`,
    });
  }

  for (const inv of invList) {
    timeline.push({
      id: inv.id,
      type: "invoice",
      title: `INVOICE: ${inv.invoiceNumber} — ${inv.title}`,
      subtitle: `Status: ${inv.status} • Due: ${inv.dueDate || "N/A"}`,
      date: inv.issuedDate || inv.createdAt,
      status: inv.status,
      amount: `${inv.amount} ${inv.currency}`,
    });
  }

  for (const p of payList) {
    timeline.push({
      id: p.id,
      type: "payment",
      title: `PAYMENT: ${p.receiptNumber} (${p.method.toUpperCase()})`,
      subtitle: `Reference: ${p.reference || "None"}`,
      date: p.paymentDate || p.createdAt,
      status: p.status,
      amount: `${p.amount} ${p.currency}`,
    });
  }

  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return ok({
    contact,
    timeline,
    counts: {
      activities: actList.length,
      deals: dealList.length,
      quotations: quoteList.length,
      invoices: invList.length,
      payments: payList.length,
    },
  });
}
