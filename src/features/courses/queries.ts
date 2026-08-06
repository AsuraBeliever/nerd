import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { type Course, type CourseBlock, courseBlocks, courses, terms } from "@/db/schema";

/**
 * Toda función de aquí recibe `userId` y filtra por él. Es la regla que
 * impide que un usuario vea datos de otro (docs/08-seguridad.md).
 */

export async function getActiveTerm(userId: string) {
  const [term] = await db
    .select()
    .from(terms)
    .where(and(eq(terms.userId, userId), eq(terms.isActive, true)))
    .orderBy(desc(terms.createdAt))
    .limit(1);
  return term ?? null;
}

export async function listTerms(userId: string) {
  return db.select().from(terms).where(eq(terms.userId, userId)).orderBy(desc(terms.createdAt));
}

export async function listCourses(userId: string, termId?: string): Promise<Course[]> {
  const term = termId ?? (await getActiveTerm(userId))?.id;
  if (!term) return [];
  return db
    .select()
    .from(courses)
    .where(and(eq(courses.userId, userId), eq(courses.termId, term), isNull(courses.archivedAt)))
    .orderBy(asc(courses.name));
}

export async function getCourse(userId: string, courseId: string): Promise<Course | null> {
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.userId, userId), eq(courses.id, courseId)))
    .limit(1);
  return course ?? null;
}

export async function listBlocks(userId: string, courseId?: string): Promise<CourseBlock[]> {
  const where = courseId
    ? and(eq(courseBlocks.userId, userId), eq(courseBlocks.courseId, courseId))
    : eq(courseBlocks.userId, userId);

  return db
    .select()
    .from(courseBlocks)
    .where(where)
    .orderBy(asc(courseBlocks.weekday), asc(courseBlocks.startTime));
}

export type ScheduleBlock = CourseBlock & { course: Course };

/** Bloques del semestre activo, con su materia — lo que dibuja el horario. */
export async function getSchedule(userId: string, termId?: string): Promise<ScheduleBlock[]> {
  const term = termId ?? (await getActiveTerm(userId))?.id;
  if (!term) return [];

  const rows = await db
    .select({ block: courseBlocks, course: courses })
    .from(courseBlocks)
    .innerJoin(courses, eq(courseBlocks.courseId, courses.id))
    .where(
      and(eq(courseBlocks.userId, userId), eq(courses.termId, term), isNull(courses.archivedAt)),
    )
    .orderBy(asc(courseBlocks.weekday), asc(courseBlocks.startTime));

  return rows.map((r) => ({ ...r.block, course: r.course }));
}
