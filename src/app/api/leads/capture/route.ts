import { db } from "@/db";
import { leadSubmissions, contacts, notifications, users, activities } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, phone, company, message, source } = body;

    if (!name || !email) {
      return Response.json({ success: false, error: "Name and email are required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }

    // Check or create contact
    let contactId: string | null = null;
    const [existingContact] = await db.select().from(contacts).where(eq(contacts.email, email.toLowerCase().trim()));

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
          email: email.toLowerCase().trim(),
          phone: phone || null,
          title: "Inbound Prospect",
          status: "lead",
          source: source || "website_form",
          notes: message ? `Website inquiry: ${message}` : null,
        })
        .returning();
      contactId = newContact.id;
    }

    // Record submission
    const [submission] = await db
      .insert(leadSubmissions)
      .values({
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        company: company || null,
        message: message || null,
        source: source || "website_form",
        status: "new",
        contactId,
      })
      .returning();

    // Round-robin sales rep assignment
    let assignedOwnerId: string | null = null;
    try {
      const salesReps = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.isActive, true));

      if (salesReps.length > 0) {
        // Find total leads to rotate deterministically
        const totalLeads = await db.select().from(leadSubmissions);
        const repIndex = (totalLeads.length - 1) % salesReps.length;
        const rep = salesReps[repIndex >= 0 ? repIndex : 0];
        assignedOwnerId = rep.id;

        // Assign contact owner
        if (contactId) {
          await db.update(contacts).set({ ownerId: assignedOwnerId }).where(eq(contacts.id, contactId));

          // Auto-create initial follow-up task for the assigned rep
          await db.insert(activities).values({
            type: "task",
            title: `Follow up with new lead: ${name}`,
            description: `Automated assignment via Round-Robin. Source: ${source || "website_form"}. Message: ${message || "N/A"}`,
            dueDate: new Date(Date.now() + 24 * 3600 * 1000), // Due in 24 hours
            priority: "high",
            contactId,
            assignedTo: assignedOwnerId,
          });
        }

        // Direct notification to assigned rep
        await db.insert(notifications).values({
          userId: assignedOwnerId,
          title: `🎯 New Lead Assigned: ${name}`,
          message: `Round-robin assigned you a lead from ${company || email}. Check your activities for follow-up.`,
          type: "assignment",
          entityType: "contact",
          entityId: contactId,
        });
      }

      // Also notify admins
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
      for (const a of admins) {
        if (a.id !== assignedOwnerId) {
          await db.insert(notifications).values({
            userId: a.id,
            title: `New Inbound Lead: ${name}`,
            message: `${company ? `Company: ${company} • ` : ""}${email}${phone ? ` • ${phone}` : ""}`,
            type: "lead",
            entityType: "contact",
            entityId: contactId,
          });
        }
      }
    } catch (assignErr) {
      console.error("Round robin assignment error:", assignErr);
    }

    return Response.json(
      {
        success: true,
        message: "Inbound lead captured and routed to SAKK Group CRM",
        leadId: submission.id,
        contactId,
      },
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
