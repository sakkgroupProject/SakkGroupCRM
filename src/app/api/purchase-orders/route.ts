import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { purchaseOrders, purchaseOrderItems, vendors, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

function ok(data: any, status = 200) {
  return Response.json({ success: true, ...data }, { status });
}
function err(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");
  const projectId = searchParams.get("projectId");

  const rows = await db
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      title: purchaseOrders.title,
      vendorId: purchaseOrders.vendorId,
      projectId: purchaseOrders.projectId,
      status: purchaseOrders.status,
      total: purchaseOrders.total,
      currency: purchaseOrders.currency,
      issueDate: purchaseOrders.issueDate,
      expectedDate: purchaseOrders.expectedDate,
      notes: purchaseOrders.notes,
      createdAt: purchaseOrders.createdAt,
      vendorName: vendors.name,
      projectName: projects.name,
    })
    .from(purchaseOrders)
    .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
    .leftJoin(projects, eq(purchaseOrders.projectId, projects.id))
    .orderBy(desc(purchaseOrders.createdAt));

  return ok({ items: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const { title, vendorId, projectId, status, currency = "USD", issueDate, expectedDate, notes, items = [] } = body;

  if (!title) return err("Title is required");

  // Calculate items total
  let total = 0;
  const processedItems = [];
  for (const it of items) {
    const qty = Number(it.quantity || 1);
    const price = Number(it.unitPrice || 0);
    const itemTotal = qty * price;
    total += itemTotal;
    processedItems.push({
      name: it.name || "Item",
      quantity: qty,
      unitPrice: String(price),
      total: String(itemTotal),
    });
  }

  // Generate unique PO number
  const countRes = await db.select().from(purchaseOrders);
  const poNumber = `PO-${String(countRes.length + 1001).padStart(5, "0")}`;

  const [po] = await db
    .insert(purchaseOrders)
    .values({
      poNumber,
      title,
      vendorId: vendorId || null,
      projectId: projectId || null,
      status: status || "draft",
      total: String(total || body.total || 0),
      currency,
      issueDate: issueDate || null,
      expectedDate: expectedDate || null,
      notes: notes || null,
      createdBy: user.id,
    })
    .returning();

  for (const it of processedItems) {
    await db.insert(purchaseOrderItems).values({
      poId: po.id,
      ...it,
    });
  }

  await logAudit(user.id, "po.create", "purchase_order", po.id, `Created ${poNumber}: ${title} for ${po.total} ${currency}`);
  return ok({ purchaseOrder: po, poNumber }, 201);
}
