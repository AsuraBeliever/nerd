"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { courseBlocks, courses, terms } from "@/db/schema";
import { findOverlaps } from "@/features/schedule/lib";
import { type ActionResult, fail, ok, parseOrFail } from "@/lib/action";
import { formatTime, weekdayName } from "@/lib/dates";
import { requireUserId } from "@/lib/session";
import { listBlocks } from "./queries";
import { blockSchema, courseSchema, termSchema } from "./schemas";

/** Toda escritura repite el mismo orden: sesión → validación → propiedad → escribir. */

function refresh() {
  revalidatePath("/", "layout");
}

async function ownsCourse(userId: string, courseId: string) {
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
    .limit(1);
  return Boolean(course);
}

export async function createTerm(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = parseOrFail(termSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  // Solo un semestre activo a la vez: activar uno archiva el anterior.
  await db.update(terms).set({ isActive: false }).where(eq(terms.userId, userId));

  const [term] = await db
    .insert(terms)
    .values({ ...parsed.data, userId, isActive: true })
    .returning({ id: terms.id });

  if (!term) return fail("No se pudo crear el semestre");
  refresh();
  return ok(term);
}

export async function updateTerm(id: string, input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(termSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  const result = await db
    .update(terms)
    .set(parsed.data)
    .where(and(eq(terms.id, id), eq(terms.userId, userId)))
    .returning({ id: terms.id });

  if (result.length === 0) return fail("No se encontró el semestre");
  refresh();
  return ok(undefined);
}

export async function activateTerm(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await db.update(terms).set({ isActive: false }).where(eq(terms.userId, userId));
  const result = await db
    .update(terms)
    .set({ isActive: true })
    .where(and(eq(terms.id, id), eq(terms.userId, userId)))
    .returning({ id: terms.id });

  if (result.length === 0) return fail("No se encontró el semestre");
  refresh();
  return ok(undefined);
}

/** Si el usuario no tiene semestre, se le crea uno sin preguntarle nada. */
async function ensureTerm(userId: string): Promise<string | null> {
  const [existing] = await db
    .select({ id: terms.id })
    .from(terms)
    .where(and(eq(terms.userId, userId), eq(terms.isActive, true)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(terms)
    .values({ userId, name: "Semestre actual", isActive: true })
    .returning({ id: terms.id });
  return created?.id ?? null;
}

export async function createCourse(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = parseOrFail(courseSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  const termId = await ensureTerm(userId);
  if (!termId) return fail("No se pudo preparar el semestre");

  const [course] = await db
    .insert(courses)
    .values({
      ...parsed.data,
      minAttendancePct: parsed.data.minAttendancePct?.toString() ?? null,
      userId,
      termId,
    })
    .returning({ id: courses.id });

  if (!course) return fail("No se pudo crear la materia");
  refresh();
  return ok(course);
}

export async function updateCourse(id: string, input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(courseSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  const result = await db
    .update(courses)
    .set({
      ...parsed.data,
      minAttendancePct: parsed.data.minAttendancePct?.toString() ?? null,
    })
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .returning({ id: courses.id });

  if (result.length === 0) return fail("No se encontró la materia");
  refresh();
  return ok(undefined);
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await db
    .delete(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .returning({ id: courses.id });

  if (result.length === 0) return fail("No se encontró la materia");
  refresh();
  return ok(undefined);
}

export async function createBlock(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = parseOrFail(blockSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  if (!(await ownsCourse(userId, parsed.data.courseId))) return fail("No se encontró la materia");

  const overlaps = findOverlaps({ id: "nuevo", ...parsed.data }, await listBlocks(userId));

  const [block] = await db
    .insert(courseBlocks)
    .values({ ...parsed.data, userId })
    .returning({ id: courseBlocks.id });

  if (!block) return fail("No se pudo guardar el bloque");
  refresh();

  // Se avisa del traslape, no se bloquea: puede haber casos legítimos.
  return ok(block, overlapWarning(overlaps));
}

export async function updateBlock(id: string, input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(blockSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  if (!(await ownsCourse(userId, parsed.data.courseId))) return fail("No se encontró la materia");

  const overlaps = findOverlaps({ id, ...parsed.data }, await listBlocks(userId));

  const result = await db
    .update(courseBlocks)
    .set(parsed.data)
    .where(and(eq(courseBlocks.id, id), eq(courseBlocks.userId, userId)))
    .returning({ id: courseBlocks.id });

  if (result.length === 0) return fail("No se encontró el bloque");
  refresh();
  return ok(undefined, overlapWarning(overlaps));
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await db
    .delete(courseBlocks)
    .where(and(eq(courseBlocks.id, id), eq(courseBlocks.userId, userId)))
    .returning({ id: courseBlocks.id });

  if (result.length === 0) return fail("No se encontró el bloque");
  refresh();
  return ok(undefined);
}

function overlapWarning(overlaps: { weekday: number; startTime: string; endTime: string }[]) {
  const first = overlaps[0];
  if (!first) return undefined;
  const when = `${weekdayName(first.weekday)} ${formatTime(first.startTime)}–${formatTime(first.endTime)}`;
  return overlaps.length === 1
    ? `Se encima con otra clase (${when})`
    : `Se encima con ${overlaps.length} clases (la primera, ${when})`;
}
