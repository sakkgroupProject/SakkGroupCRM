import { db } from "@/db";
import { workflowRules, auditLogs, notifications, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const rules = await db.select().from(workflowRules).orderBy(desc(workflowRules.createdAt));
    return Response.json({ success: true, items: rules });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin" && user.role !== "manager") {
      return Response.json({ success: false, error: "Only Admin/Manager can configure workflow rules" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, triggerEvent, conditionJson, actionJson } = body;

    if (!name || !triggerEvent || !actionJson) {
      return Response.json({ success: false, error: "name, triggerEvent, and actionJson are required" }, { status: 400 });
    }

    const [rule] = await db
      .insert(workflowRules)
      .values({
        name,
        triggerEvent,
        conditionJson: typeof conditionJson === "object" ? JSON.stringify(conditionJson) : conditionJson || "{}",
        actionJson: typeof actionJson === "object" ? JSON.stringify(actionJson) : actionJson,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "workflow.created",
      entityType: "workflow_rule",
      entityId: rule.id,
      details: `Created automation rule: ${name} [${triggerEvent}]`,
    });

    return Response.json({ success: true, message: "Workflow automation rule created", rule });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const { id, isActive, triggerTest } = body;

    if (!id) return Response.json({ success: false, error: "id required" }, { status: 400 });

    if (triggerTest) {
      // Simulate workflow execution
      const [rule] = await db.select().from(workflowRules).where(eq(workflowRules.id, id));
      if (!rule) return Response.json({ success: false, error: "Rule not found" }, { status: 404 });

      await db
        .update(workflowRules)
        .set({
          executionCount: (rule.executionCount || 0) + 1,
          lastTriggeredAt: new Date(),
        })
        .where(eq(workflowRules.id, id));

      await db.insert(notifications).values({
        userId: user.id,
        title: `⚡ Workflow Triggered: ${rule.name}`,
        message: `Action executed successfully: ${rule.actionJson}`,
        type: "workflow",
      });

      return Response.json({ success: true, message: `Workflow "${rule.name}" test executed successfully!` });
    }

    if (isActive !== undefined) {
      await db.update(workflowRules).set({ isActive: !!isActive }).where(eq(workflowRules.id, id));
      return Response.json({ success: true, message: `Rule ${isActive ? "activated" : "paused"}` });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin") return Response.json({ success: false, error: "Only Admin can delete workflow rules" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ success: false, error: "id required" }, { status: 400 });

    await db.delete(workflowRules).where(eq(workflowRules.id, id));
    return Response.json({ success: true, message: "Rule deleted" });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
