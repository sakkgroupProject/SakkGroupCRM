import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { purchaseOrders, purchaseOrderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

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
  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
  if (!po) return err("Purchase Order not found", 404);

  const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
  return ok({ purchaseOrder: po, items });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
  if (!po) return err("Purchase Order not found", 404);

  const [updated] = await db
    .update(purchaseOrders)
    .set({
      title: body.title !== undefined ? body.title : po.title,
      vendorId: body.vendorId !== undefined ? body.vendorId || null : po.vendorId,
      projectId: body.projectId !== undefined ? body.projectId || null : po.projectId,
      status: body.status || po.status,
      total: body.total !== undefined ? String(body.total) : po.total,
      currency: body.currency || po.currency,
      issueDate: body.issueDate || po.issueDate,
      expectedDate: body.expectedDate || po.expectedDate,
      notes: body.notes !== undefined ? body.notes : po.notes,
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, id))
    .returning();

  await logAudit(user.id, "po.update", "purchase_order", id, `Updated ${po.poNumber}`);
  return ok({ purchaseOrder: updated });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const { id } = await params;
  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
  if (!po) return err("Purchase Order not found", 404);

  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  await logAudit(user.id, "po.delete", "purchase_order", id, `Deleted ${po.poNumber}`);
  return ok({ message: "Purchase order deleted" });
}
