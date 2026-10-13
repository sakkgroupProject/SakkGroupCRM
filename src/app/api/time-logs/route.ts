import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { timeLogs, projectTasks, users } from "@/db/schema";
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
  const taskId = searchParams.get("taskId");

  let query = db
    .select({
      id: timeLogs.id,
      taskId: timeLogs.taskId,
      userId: timeLogs.userId,
      hours: timeLogs.hours,
      description: timeLogs.description,
      logDate: timeLogs.logDate,
      createdAt: timeLogs.createdAt,
      userName: users.name,
      taskTitle: projectTasks.title,
    })
    .from(timeLogs)
    .leftJoin(users, eq(timeLogs.userId, users.id))
    .leftJoin(projectTasks, eq(timeLogs.taskId, projectTasks.id))
    .orderBy(desc(timeLogs.createdAt));

  const items = taskId ? await query.where(eq(timeLogs.taskId, taskId)) : await query;
  return ok({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const { taskId, hours, description, logDate } = body;

  if (!taskId || !hours || Number(hours) <= 0) {
    return err("Valid taskId and positive hours are required");
  }

  const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, taskId));
  if (!task) return err("Project task not found", 404);

  const [log] = await db
    .insert(timeLogs)
    .values({
      taskId,
      userId: user.id,
      hours: String(hours),
      description: description || null,
      logDate: logDate || new Date().toISOString().slice(0, 10),
    })
    .returning();

  // Increment actualHours on task
  const newActualHours = (Number(task.actualHours || 0) + Number(hours)).toFixed(2);
  await db.update(projectTasks).set({ actualHours: newActualHours }).where(eq(projectTasks.id, taskId));

  await logAudit(user.id, "time.log", "project_task", taskId, `Logged ${hours}h on task ${task.title}`);
  return ok({ timeLog: log, updatedActualHours: newActualHours }, 201);
}
