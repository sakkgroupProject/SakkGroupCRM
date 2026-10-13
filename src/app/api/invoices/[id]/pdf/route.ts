import { db } from "@/db";
import { invoices, invoiceItems, companies, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, unauthorized, err } from "@/lib/auth";
import { invoiceBalance } from "@/lib/finance";
import { round2 } from "@/lib/audit";
import { generateSakkInvoicePdf } from "@/lib/pdf";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return unauthorized();

  const { id } = await params;
  const bal = await invoiceBalance(id);
  if (!bal) return err("Invoice not found", 404);

  const inv: any = bal.invoice;

  // 1. Fetch Company details
  let clientName = "VALUED CLIENT";
  let attnName: string | undefined;

  if (inv.companyId) {
    const [comp] = await db.select().from(companies).where(eq(companies.id, inv.companyId));
    if (comp?.name) clientName = comp.name;
  }

  // 2. Fetch Contact details
  if (inv.contactId) {
    const [cont] = await db.select().from(contacts).where(eq(contacts.id, inv.contactId));
    if (cont) {
      const full = `${cont.firstName || ""} ${cont.lastName || ""}`.trim();
      if (full) attnName = full;
      if (!inv.companyId && full) {
        clientName = full;
      }
    }
  }

  // If title looks like a client, or fallback
  if (clientName === "VALUED CLIENT" && inv.title && !inv.companyId && !inv.contactId) {
    clientName = inv.title.toUpperCase();
  }

  // 3. Fetch Line Items
  const rawItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  let items: { description: string; amount: number }[] = [];
  let subtotal = 0;

  if (rawItems.length > 0) {
    items = rawItems.map((i) => ({
      description: i.name,
      amount: Number(i.total),
    }));
    subtotal = round2(items.reduce((acc, curr) => acc + curr.amount, 0));
  } else {
    const lineAmt = round2(Number(inv.amount || 0) * Number(inv.quantity || 1));
    items = [{
      description: inv.title || "Professional IT & Consulting Services",
      amount: lineAmt,
    }];
    subtotal = lineAmt;
  }

  // 4. Calculations
  const taxRate = Number(inv.taxRate || 0);
  const taxAmount = round2(subtotal * (taxRate / 100));
  const totalAmount = round2(subtotal + taxAmount);
  const amountPaid = Number(bal.paidAmount || 0);
  const balanceDue = Number(bal.outstanding ?? Math.max(0, totalAmount - amountPaid));

  // 5. Payment Status
  let paymentStatus = "Pending";
  if (bal.derivedStatus === "paid" || balanceDue <= 0) {
    paymentStatus = "Paid";
  } else if (bal.derivedStatus === "partially_paid" || amountPaid > 0) {
    paymentStatus = "Partially Paid";
  }

  const curr = (inv.currency || "USD").toUpperCase();

  // 6. Note Lines matching reference invoice
  const noteLine1 = `- Amount paid of ${curr} ${amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been received and adjusted against the total invoice value.`;
  const noteLine2 = balanceDue > 0
    ? `- Remaining balance of ${curr} ${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is payable via Bank Transfer / Wise to the account below.`
    : `- Invoice is fully paid. Thank you for your business.`;

  // 7. Generate Pixel-Perfect SAKK Group PDF
  const pdfBuffer = await generateSakkInvoicePdf({
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.issuedDate || inv.createdAt,
    clientName,
    attnName,
    modeOfPayment: "Bank Transfer / Wise",
    paymentStatus,
    currency: curr,
    items,
    subtotal,
    taxRate,
    taxAmount,
    totalAmount,
    amountPaid,
    balanceDue,
    noteLine1,
    noteLine2,
  });

  return new Response(pdfBuffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${inv.invoiceNumber}.pdf"`,
    },
  });
}
