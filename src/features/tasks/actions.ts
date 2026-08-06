"use server";

import { and, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { courses, subtasks, tasks } from "@/db/schema";
import { type ActionResult, fail, ok, parseOrFail } from "@/lib/action";
import { zonedInputToUtc } from "@/lib/dates";
import { requireUser, requireUserId } from "@/lib/session";
import { subtaskSchema, taskSchema } from "./schemas";

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * El formulario manda "2026-08-07" o "2026-08-07T19:00". Se interpreta en la
 * zona del usuario y se guarda en UTC, nunca al revés.
 */
function toDueDate(value: string | null, hasTime: boolean, timezone: string): Date | null {
  if (!value) return null;
  const [date, time] = value.split("T");
  return zonedInputToUtc(date ?? null, hasTime ? (time ?? null) : null, timezone);
}

async function ownsCourse(userId: string, courseId: string) {
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
    .limit(1);
  return Boolean(course);
}

async function ownsTask(userId: string, taskId: string) {
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1);
  return Boolean(task);
}

export async function createTask(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const userId = user.id;
  const parsed = parseOrFail(taskSchema, input);
  if (!parsed.ok) return fail(parsed.error);
  const data = parsed.data;

  if (data.courseId && !(await ownsCourse(userId, data.courseId))) {
    return fail("No se encontró la materia");
  }

  // Los pendientes personales se ordenan a mano: el nuevo va al final.
  const [{ value: lastOrder } = { value: null }] = await db
    .select({ value: max(tasks.sortOrder) })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.courseId)));

  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      courseId: data.courseId,
      title: data.title,
      notes: data.notes,
      type: data.type,
      dueAt: toDueDate(data.dueAt, data.hasTime, user.timezone),
      hasTime: data.hasTime,
      priority: data.priority,
      sortOrder: (lastOrder ?? 0) + 1,
    })
    .returning({ id: tasks.id });

  if (!task) return fail("No se pudo crear la tarea");
  refresh();
  return ok(task);
}

export async function updateTask(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const userId = user.id;
  const parsed = parseOrFail(taskSchema, input);
  if (!parsed.ok) return fail(parsed.error);
  const data = parsed.data;

  if (data.courseId && !(await ownsCourse(userId, data.courseId))) {
    return fail("No se encontró la materia");
  }

  const result = await db
    .update(tasks)
    .set({
      courseId: data.courseId,
      title: data.title,
      notes: data.notes,
      type: data.type,
      dueAt: toDueDate(data.dueAt, data.hasTime, user.timezone),
      hasTime: data.hasTime,
      priority: data.priority,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });

  if (result.length === 0) return fail("No se encontró la tarea");
  refresh();
  return ok(undefined);
}

/** Completar y deshacer son la misma acción: el usuario puede arrepentirse. */
export async function setTaskDone(id: string, done: boolean): Promise<ActionResult> {
  const userId = await requireUserId();

  const result = await db
    .update(tasks)
    .set({
      status: done ? "done" : "todo",
      completedAt: done ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });

  if (result.length === 0) return fail("No se encontró la tarea");
  refresh();
  return ok(undefined);
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });

  if (result.length === 0) return fail("No se encontró la tarea");
  refresh();
  return ok(undefined);
}

/** Guarda el orden manual completo, sin huecos ni empates. */
export async function reorderTasks(orderedIds: string[]): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(z.array(z.uuid()).max(500), orderedIds);
  if (!parsed.ok) return fail(parsed.error);

  await db.transaction(async (tx) => {
    for (const [index, id] of parsed.data.entries()) {
      await tx
        .update(tasks)
        .set({ sortOrder: index })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    }
  });

  refresh();
  return ok(undefined);
}

export async function createSubtask(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(subtaskSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  if (!(await ownsTask(userId, parsed.data.taskId))) return fail("No se encontró la tarea");

  const [{ value: lastOrder } = { value: null }] = await db
    .select({ value: max(subtasks.sortOrder) })
    .from(subtasks)
    .where(eq(subtasks.taskId, parsed.data.taskId));

  await db.insert(subtasks).values({
    taskId: parsed.data.taskId,
    title: parsed.data.title,
    sortOrder: (lastOrder ?? 0) + 1,
  });

  refresh();
  return ok(undefined);
}

export async function setSubtaskDone(id: string, done: boolean): Promise<ActionResult> {
  const userId = await requireUserId();

  // El padre es quien tiene el dueño: se verifica antes de tocar el hijo.
  const [row] = await db
    .select({ taskId: subtasks.taskId })
    .from(subtasks)
    .where(eq(subtasks.id, id))
    .limit(1);
  if (!row || !(await ownsTask(userId, row.taskId))) return fail("No se encontró el paso");

  await db.update(subtasks).set({ done }).where(eq(subtasks.id, id));
  refresh();
  return ok(undefined);
}

export async function deleteSubtask(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const [row] = await db
    .select({ taskId: subtasks.taskId })
    .from(subtasks)
    .where(eq(subtasks.id, id))
    .limit(1);
  if (!row || !(await ownsTask(userId, row.taskId))) return fail("No se encontró el paso");

  await db.delete(subtasks).where(eq(subtasks.id, id));
  refresh();
  return ok(undefined);
}
