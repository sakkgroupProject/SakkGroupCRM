import { db } from "@/db";
import { customFields } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");

    const query = entityType
      ? db.select().from(customFields).where(eq(customFields.entityType, entityType))
      : db.select().from(customFields);

    const items = await query;
    return Response.json({ success: true, items });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin" && user.role !== "manager") {
      return Response.json({ success: false, error: "Only Admin/Manager can configure custom fields" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { entityType, fieldName, fieldLabel, fieldType, optionsJson, isRequired } = body;

    if (!entityType || !fieldName || !fieldLabel) {
      return Response.json({ success: false, error: "entityType, fieldName, and fieldLabel are required" }, { status: 400 });
    }

    const cleanName = fieldName.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const [field] = await db
      .insert(customFields)
      .values({
        entityType,
        fieldName: cleanName,
        fieldLabel,
        fieldType: fieldType || "text",
        optionsJson: optionsJson ? JSON.stringify(optionsJson) : null,
        isRequired: !!isRequired,
      })
      .returning();

    return Response.json({ success: true, message: "Custom field created", field });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin") {
      return Response.json({ success: false, error: "Only Admin can delete custom fields" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ success: false, error: "id is required" }, { status: 400 });

    await db.delete(customFields).where(eq(customFields.id, id));
    return Response.json({ success: true, message: "Custom field deleted" });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
