import "server-only";
import { and, asc, desc, eq, gte, isNotNull, isNull, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { type Course, courses, type Subtask, subtasks, type Task, tasks } from "@/db/schema";

export type TaskWithCourse = Task & { course: Course | null };

type Scope = "academic" | "personal" | "all";

/**
 * Tareas académicas y pendientes personales salen de la misma tabla; el
 * `scope` es lo único que las separa (ADR-004). Encapsularlo aquí evita
 * que alguna vista olvide el filtro y los mezcle.
 */
function scopeFilter(scope: Scope) {
  if (scope === "academic") return isNotNull(tasks.courseId);
  if (scope === "personal") return isNull(tasks.courseId);
  return undefined;
}

export async function listTasks(
  userId: string,
  {
    scope = "all",
    includeDone = false,
    courseId,
    limit,
  }: { scope?: Scope; includeDone?: boolean; courseId?: string; limit?: number } = {},
): Promise<TaskWithCourse[]> {
  const rows = await db
    .select({ task: tasks, course: courses })
    .from(tasks)
    .leftJoin(courses, eq(tasks.courseId, courses.id))
    .where(
      and(
        eq(tasks.userId, userId),
        scopeFilter(scope),
        courseId ? eq(tasks.courseId, courseId) : undefined,
        includeDone ? undefined : ne(tasks.status, "done"),
      ),
    )
    .orderBy(asc(tasks.dueAt), asc(tasks.sortOrder), desc(tasks.createdAt))
    .limit(limit ?? 500);

  return rows.map((r) => ({ ...r.task, course: r.course }));
}

export async function getTask(userId: string, taskId: string): Promise<TaskWithCourse | null> {
  const [row] = await db
    .select({ task: tasks, course: courses })
    .from(tasks)
    .leftJoin(courses, eq(tasks.courseId, courses.id))
    .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
    .limit(1);

  return row ? { ...row.task, course: row.course } : null;
}

export async function listSubtasks(taskId: string): Promise<Subtask[]> {
  return db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .orderBy(asc(subtasks.sortOrder));
}

/** Lo que vence entre dos fechas: alimenta el dashboard. */
export async function listDueBetween(
  userId: string,
  from: Date,
  to: Date,
  limit = 5,
): Promise<TaskWithCourse[]> {
  const rows = await db
    .select({ task: tasks, course: courses })
    .from(tasks)
    .leftJoin(courses, eq(tasks.courseId, courses.id))
    .where(
      and(
        eq(tasks.userId, userId),
        ne(tasks.status, "done"),
        isNotNull(tasks.dueAt),
        gte(tasks.dueAt, from),
        lte(tasks.dueAt, to),
      ),
    )
    .orderBy(asc(tasks.dueAt))
    .limit(limit);

  return rows.map((r) => ({ ...r.task, course: r.course }));
}

/** Cuántas tareas pendientes tiene cada materia. */
export async function countPendingByCourse(userId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ courseId: tasks.courseId })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), ne(tasks.status, "done"), isNotNull(tasks.courseId)));

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.courseId) continue;
    counts.set(row.courseId, (counts.get(row.courseId) ?? 0) + 1);
  }
  return counts;
}
