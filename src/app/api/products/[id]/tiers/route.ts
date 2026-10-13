import { db } from "@/db";
import { productPriceTiers, products } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const tiers = await db
      .select()
      .from(productPriceTiers)
      .where(eq(productPriceTiers.productId, id))
      .orderBy(asc(productPriceTiers.minQuantity));

    return Response.json({ success: true, items: tiers });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin" && user.role !== "manager") {
      return Response.json({ success: false, error: "Only Admin/Manager can manage price tiers" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { minQuantity, maxQuantity, unitPrice, discountPercent } = body;

    if (!minQuantity || unitPrice === undefined) {
      return Response.json({ success: false, error: "minQuantity and unitPrice are required" }, { status: 400 });
    }

    const [tier] = await db
      .insert(productPriceTiers)
      .values({
        productId: id,
        minQuantity: Number(minQuantity),
        maxQuantity: maxQuantity ? Number(maxQuantity) : null,
        unitPrice: String(unitPrice),
        discountPercent: String(discountPercent || "0"),
      })
      .returning();

    return Response.json({ success: true, message: "Price tier created", tier });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin" && user.role !== "manager") {
      return Response.json({ success: false, error: "Only Admin/Manager can delete price tiers" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tierId = searchParams.get("tierId");
    if (!tierId) {
      return Response.json({ success: false, error: "tierId is required" }, { status: 400 });
    }

    await db.delete(productPriceTiers).where(eq(productPriceTiers.id, tierId));
    return Response.json({ success: true, message: "Price tier deleted" });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
