import { db } from "@/db";
import { invoices, invoiceItems, contacts, companies, products } from "@/db/schema";
import { eq, ilike, and, desc } from "drizzle-orm";
import { getCurrentUser, unauthorized, err, ok } from "@/lib/auth";
import { invoiceBalance, invoiceTotal } from "@/lib/finance";
import { round2, logAudit } from "@/lib/audit";
import { getNextSakkInvoiceNumber } from "@/lib/invoice-sequence";

export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u) return unauthorized();

  const url = new URL(req.url);
  if (url.searchParams.get("action") === "next-number") {
    const nextNumber = await getNextSakkInvoiceNumber();
    return ok({ nextInvoiceNumber: nextNumber });
  }

  const status = url.searchParams.get("status") || "";
  const search = url.searchParams.get("search") || "";
  const conds: any[] = [];
  if (status && status !== "partially_paid") conds.push(eq(invoices.status, status));
  if (search) conds.push(ilike(invoices.title, `%${search}%`));

  const rows = await db
    .select({
      inv: invoices,
      contactFirst: contacts.firstName,
      contactLast: contacts.lastName,
      companyName: companies.name,
      productName: products.name,
    })
    .from(invoices)
    .leftJoin(contacts, eq(invoices.contactId, contacts.id))
    .leftJoin(companies, eq(invoices.companyId, companies.id))
    .leftJoin(products, eq(invoices.productId, products.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(invoices.createdAt));

  const items = [];
  for (const r of rows) {
    const bal = await invoiceBalance(r.inv.id);
    const lineItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, r.inv.id));
    items.push({
      ...r.inv,
      contactName: r.contactFirst ? `${r.contactFirst} ${r.contactLast}` : null,
      companyName: r.companyName,
      productName: r.productName,
      items: lineItems,
      total: bal?.total ?? invoiceTotal(r.inv),
      paidAmount: bal?.paidAmount ?? 0,
      creditAmount: bal?.creditAmount ?? 0,
      outstanding: bal?.outstanding ?? 0,
      derivedStatus: bal?.derivedStatus ?? r.inv.status,
    });
  }

  const filtered = status === "partially_paid" ? items.filter((i) => i.derivedStatus === "partially_paid") : items;
  const nextInvoiceNumber = await getNextSakkInvoiceNumber();
  return ok({ items: filtered, total: filtered.length, nextInvoiceNumber });
}

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return unauthorized();

  const b = await req.json();
  if (!b.title) return err("Invoice title is required");

  const lineItems: any[] = Array.isArray(b.items) ? b.items : [];
  let amount = Number(b.amount || 0);
  let quantity = Number(b.quantity || 1);

  if (lineItems.length) {
    amount = round2(lineItems.reduce((s, i) => s + Number(i.quantity || 1) * Number(i.unitPrice || 0), 0));
    quantity = 1;
  }

  const num = b.invoiceNumber && b.invoiceNumber.trim() ? b.invoiceNumber.trim() : await getNextSakkInvoiceNumber();

  const [row] = await db
    .insert(invoices)
    .values({
      invoiceNumber: num,
      title: b.title,
      contactId: b.contactId || null,
      companyId: b.companyId || null,
      dealId: b.dealId || null,
      productId: b.productId || null,
      quantity,
      amount: String(amount),
      taxRate: String(b.taxRate || 0),
      currency: b.currency || "USD",
      status: b.status || "draft",
      issuedDate: b.issuedDate || new Date().toISOString().slice(0, 10),
      dueDate: b.dueDate || null,
      notes: b.notes || null,
      createdBy: u.id,
    })
    .returning();

  for (const i of lineItems) {
    await db.insert(invoiceItems).values({
      invoiceId: row.id,
      productId: i.productId || null,
      name: i.name || "Item",
      quantity: Number(i.quantity || 1),
      unitPrice: String(i.unitPrice || 0),
      total: String(round2(Number(i.quantity || 1) * Number(i.unitPrice || 0))),
    });
  }

  await logAudit(u.id, "invoice.create", "invoice", row.id, String(invoiceTotal(row)));
  return ok(row, 201);
}
