import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { leadSubmissions, contacts, activities, notifications, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

function ok(data: any, status = 200) {
  return Response.json({ success: true, ...data }, { status });
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

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const { name, email, phone, company, message, source = "manual_entry", status = "new", assignedTo } = body;

  if (!name || !name.trim()) {
    return err("Lead name is required");
  }

  const cleanEmail = email ? email.toLowerCase().trim() : `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}@lead.sakkgroup.com`;

  // 1. Check or create contact
  let contactId: string | null = null;
  const [existingContact] = await db.select().from(contacts).where(eq(contacts.email, cleanEmail));

  if (existingContact) {
    contactId = existingContact.id;
  } else {
    const parts = name.trim().split(" ");
    const firstName = parts[0] || "Inbound";
    const lastName = parts.slice(1).join(" ") || "Lead";

    const [newContact] = await db
      .insert(contacts)
      .values({
        firstName,
        lastName,
        email: cleanEmail,
        phone: phone || null,
        title: "Prospective Lead",
        status: "lead",
        source: source || "manual_entry",
        ownerId: assignedTo || user.id,
        notes: message ? `Lead details: ${message}` : null,
      })
      .returning();
    contactId = newContact.id;
  }

  // 2. Insert into lead_submissions
  const [submission] = await db
    .insert(leadSubmissions)
    .values({
      name: name.trim(),
      email: cleanEmail,
      phone: phone || null,
      company: company || null,
      message: message || null,
      source: source || "manual_entry",
      status: status || "new",
      contactId,
    })
    .returning();

  // 3. Assign sales rep & create follow-up activity
  const finalAssigneeId = assignedTo || user.id;

  try {
    if (contactId) {
      await db.update(contacts).set({ ownerId: finalAssigneeId }).where(eq(contacts.id, contactId));

      await db.insert(activities).values({
        type: "task",
        title: `Follow up with new lead: ${name}`,
        description: `Lead added via ${source.replace("_", " ")}. Requirement: ${message || "Initial qualification call."}`,
        dueDate: new Date(Date.now() + 24 * 3600 * 1000), // Due in 24 hours
        priority: "high",
        contactId,
        assignedTo: finalAssigneeId,
      });

      await db.insert(notifications).values({
        userId: finalAssigneeId,
        title: `🎯 New Lead Recorded: ${name}`,
        message: `Lead registered (${company || cleanEmail}). Follow-up task scheduled in Activities.`,
        type: "lead",
        entityType: "contact",
        entityId: contactId,
      });
    }
  } catch (e) {
    console.error("Lead assignment error:", e);
  }

  return ok({ submission, contactId }, 201);
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

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return err("Lead ID required");

  await db.delete(leadSubmissions).where(eq(leadSubmissions.id, id));
  return ok({ deleted: true });
}
