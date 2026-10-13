import { db } from "@/db";
import { users, projectTasks, timeLogs } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAuth();

    const [allUsers, allTasks, allLogs] = await Promise.all([
      db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive }).from(users).where(eq(users.isActive, true)),
      db.select().from(projectTasks),
      db.select().from(timeLogs),
    ]);

    const workload = allUsers.map((u) => {
      const userTasks = allTasks.filter((t) => t.assignedTo === u.id);
      const openTasks = userTasks.filter((t) => t.status !== "done");

      const estimatedHours = openTasks.reduce((sum, t) => sum + Number(t.estimatedHours || 0), 0);
      const actualHours = allLogs.filter((l) => l.userId === u.id).reduce((sum, l) => sum + Number(l.hours || 0), 0);

      const weeklyCapacity = 40; // Standard 40 hours per week
      const utilization = Math.round((estimatedHours / weeklyCapacity) * 100);

      let status: "optimal" | "heavy" | "overloaded" = "optimal";
      if (utilization > 100) status = "overloaded";
      else if (utilization >= 75) status = "heavy";

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalTasks: userTasks.length,
        openTasks: openTasks.length,
        estimatedHours,
        actualHours,
        weeklyCapacity,
        utilization,
        status,
      };
    });

    return Response.json({ success: true, items: workload });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
