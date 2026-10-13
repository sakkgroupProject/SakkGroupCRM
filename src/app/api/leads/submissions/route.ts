import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { leadSubmissions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

function ok(data: any) {
  return Response.json({ success: true, ...data });
}
function err(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const items = await db.select().from(leadSubmissions).orderBy(desc(leadSubmissions.createdAt));
  return ok({ items });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const { id, status } = body;
  if (!id || !status) return err("id and status required");

  const [updated] = await db
    .update(leadSubmissions)
    .set({ status })
    .where(eq(leadSubmissions.id, id))
    .returning();

  return ok({ submission: updated });
}
