"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { attendanceRecords, courseBlocks, courses } from "@/db/schema";
import { type ActionResult, fail, ok, parseOrFail } from "@/lib/action";
import { requireUserId } from "@/lib/session";

const markSchema = z.object({
  courseId: z.uuid(),
  blockId: z.uuid().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  status: z.enum(["present", "absent", "late", "excused", "cancelled"]),
  notes: z.string().trim().max(500).nullable().catch(null),
});

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Marca la asistencia de una sesión. Es un upsert: volver a tocar el mismo
 * día cambia el estado en vez de crear otro registro.
 *
 * No se puede marcar una clase que todavía no ocurre.
 */
export async function markAttendance(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(markSchema, input);
  if (!parsed.ok) return fail(parsed.error);
  const { courseId, blockId, date, status, notes } = parsed.data;

  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
    .limit(1);
  if (!course) return fail("No se encontró la materia");

  if (blockId) {
    const [block] = await db
      .select({ id: courseBlocks.id })
      .from(courseBlocks)
      .where(and(eq(courseBlocks.id, blockId), eq(courseBlocks.userId, userId)))
      .limit(1);
    if (!block) return fail("No se encontró la clase");
  }

  const existing = await db
    .select({ id: attendanceRecords.id })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.userId, userId),
        eq(attendanceRecords.courseId, courseId),
        eq(attendanceRecords.date, date),
        blockId ? eq(attendanceRecords.blockId, blockId) : eq(attendanceRecords.courseId, courseId),
      ),
    )
    .limit(1);

  const current = existing[0];

  if (current) {
    await db
      .update(attendanceRecords)
      .set({ status, notes })
      .where(eq(attendanceRecords.id, current.id));
  } else {
    await db.insert(attendanceRecords).values({ userId, courseId, blockId, date, status, notes });
  }

  refresh();
  return ok(undefined);
}

/** Quitar el registro: la sesión vuelve a "sin registrar", que no es falta. */
export async function clearAttendance(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await db
    .delete(attendanceRecords)
    .where(and(eq(attendanceRecords.id, id), eq(attendanceRecords.userId, userId)))
    .returning({ id: attendanceRecords.id });

  if (result.length === 0) return fail("No se encontró el registro");
  refresh();
  return ok(undefined);
}
