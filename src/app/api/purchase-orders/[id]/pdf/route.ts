import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { purchaseOrders, purchaseOrderItems, vendors, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { makePdf } from "@/lib/pdf";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
  if (!po) return new Response("Not found", { status: 404 });

  let vendorName = "—";
  if (po.vendorId) {
    const [v] = await db.select().from(vendors).where(eq(vendors.id, po.vendorId));
    if (v) vendorName = v.name;
  }

  let projectName = "—";
  if (po.projectId) {
    const [p] = await db.select().from(projects).where(eq(projects.id, po.projectId));
    if (p) projectName = p.name;
  }

  const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));

  const lines = [
    `PURCHASE ORDER: ${po.poNumber}`,
    `Title: ${po.title}`,
    `Vendor: ${vendorName}`,
    `Project: ${projectName}`,
    `Status: ${po.status.toUpperCase()}`,
    `Issue Date: ${po.issueDate || "N/A"}`,
    `Expected Delivery Date: ${po.expectedDate || "N/A"}`,
    "",
    "--- ORDERED ITEMS ---",
    ...items.map((it) => `• ${it.name} | Qty: ${it.quantity} @ ${it.unitPrice} = ${it.total} ${po.currency}`),
    "",
    `TOTAL AMOUNT: ${po.total} ${po.currency}`,
    "",
    po.notes ? `Notes/Terms: ${po.notes}` : "",
  ];

  const buf = await makePdf(`Purchase Order ${po.poNumber}`, lines);
  return new Response(buf as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${po.poNumber}.pdf"`,
    },
  });
}
