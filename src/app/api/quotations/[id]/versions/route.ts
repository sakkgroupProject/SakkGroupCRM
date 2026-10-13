import { db } from "@/db";
import { quotations, quotationItems, quotationVersions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const versions = await db
      .select()
      .from(quotationVersions)
      .where(eq(quotationVersions.quotationId, id))
      .orderBy(desc(quotationVersions.versionNumber));

    return Response.json({ success: true, items: versions });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { notes } = body;

    const [quote] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!quote) {
      return Response.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id));

    const existingVersions = await db
      .select({ versionNumber: quotationVersions.versionNumber })
      .from(quotationVersions)
      .where(eq(quotationVersions.quotationId, id))
      .orderBy(desc(quotationVersions.versionNumber))
      .limit(1);

    const nextVersion = (existingVersions[0]?.versionNumber || 0) + 1;

    const [version] = await db
      .insert(quotationVersions)
      .values({
        quotationId: id,
        versionNumber: nextVersion,
        title: quote.title,
        subtotal: quote.subtotal,
        discount: quote.discount,
        taxRate: quote.taxRate,
        total: quote.total,
        itemsJson: JSON.stringify(items),
        notes: notes || `Revision snapshot v${nextVersion}`,
        createdBy: user.id,
      })
      .returning();

    return Response.json({
      success: true,
      message: `Quotation version v${nextVersion} snapshot created`,
      version,
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
