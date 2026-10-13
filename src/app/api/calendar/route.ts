import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { activities, projectTasks, invoices } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";

function ok(data: any) {
  return Response.json({ success: true, ...data });
}
function err(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const [actList, taskList, invList] = await Promise.all([
    db.select().from(activities).where(isNotNull(activities.dueDate)).orderBy(desc(activities.dueDate)),
    db.select().from(projectTasks).where(isNotNull(projectTasks.dueDate)).orderBy(desc(projectTasks.dueDate)),
    db.select().from(invoices).where(isNotNull(invoices.dueDate)).orderBy(desc(invoices.dueDate)),
  ]);

  const events: Array<{
    id: string;
    title: string;
    type: "activity" | "task" | "invoice";
    date: string;
    status: string;
    priority?: string;
    entityId: string;
  }> = [];

  for (const a of actList) {
    if (a.dueDate) {
      events.push({
        id: a.id,
        title: `${a.type.toUpperCase()}: ${a.title}`,
        type: "activity",
        date: new Date(a.dueDate).toISOString().slice(0, 10),
        status: a.completed ? "completed" : "pending",
        priority: a.priority,
        entityId: a.id,
      });
    }
  }

  for (const t of taskList) {
    if (t.dueDate) {
      events.push({
        id: t.id,
        title: `TASK: ${t.title}`,
        type: "task",
        date: String(t.dueDate).slice(0, 10),
        status: t.status,
        priority: t.priority,
        entityId: t.id,
      });
    }
  }

  for (const inv of invList) {
    if (inv.dueDate) {
      events.push({
        id: inv.id,
        title: `DUE: ${inv.invoiceNumber} (${inv.amount} ${inv.currency})`,
        type: "invoice",
        date: String(inv.dueDate).slice(0, 10),
        status: inv.status,
        entityId: inv.id,
      });
    }
  }

  return ok({ events });
}
