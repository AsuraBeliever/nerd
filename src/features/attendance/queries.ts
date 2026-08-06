import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  type AttendanceStatus,
  attendanceRecords,
  type Course,
  courseBlocks,
  courses,
  type User,
} from "@/db/schema";
import { getActiveTerm } from "@/features/courses/queries";
import { type AttendanceRules, type AttendanceSummary, summarize } from "./lib";

/** Las reglas del usuario, con el mínimo de la materia si lo tiene. */
export function rulesFor(user: User, course?: Pick<Course, "minAttendancePct">): AttendanceRules {
  return {
    minPct: Number(course?.minAttendancePct ?? user.defaultMinAttendancePct),
    excusedCountsAsPresent: user.excusedCountsAsPresent,
    trackLates: user.trackLates,
    latesPerAbsence: user.latesPerAbsence,
  };
}

export type CourseAttendance = { course: Course; summary: AttendanceSummary };

/** Resumen por materia del semestre activo, ordenado por riesgo. */
export async function getAttendanceByCourse(user: User): Promise<CourseAttendance[]> {
  const term = await getActiveTerm(user.id);
  if (!term) return [];

  const [courseRows, blockRows, records] = await Promise.all([
    db
      .select()
      .from(courses)
      .where(
        and(eq(courses.userId, user.id), eq(courses.termId, term.id), isNull(courses.archivedAt)),
      ),
    db.select().from(courseBlocks).where(eq(courseBlocks.userId, user.id)),
    db.select().from(attendanceRecords).where(eq(attendanceRecords.userId, user.id)),
  ]);

  const summaries = courseRows.map((course) => {
    const statuses = records
      .filter((r) => r.courseId === course.id)
      .map((r) => r.status as AttendanceStatus);

    return {
      course,
      summary: summarize({
        statuses,
        rules: rulesFor(user, course),
        blocksPerWeek: blockRows.filter((b) => b.courseId === course.id).length,
        startDate: term.startDate,
        endDate: term.endDate,
        override: course.expectedSessionsOverride,
      }),
    };
  });

  const order = { exceeded: 0, critical: 1, warning: 2, safe: 3, none: 4 } as const;
  return summaries.sort((a, b) => order[a.summary.level] - order[b.summary.level]);
}

export async function getCourseAttendance(
  user: User,
  courseId: string,
): Promise<CourseAttendance | null> {
  const all = await getAttendanceByCourse(user);
  return all.find((c) => c.course.id === courseId) ?? null;
}

export async function listCourseRecords(userId: string, courseId: string) {
  return db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.courseId, courseId)))
    .orderBy(desc(attendanceRecords.date));
}

export type TodaySession = {
  blockId: string;
  courseId: string;
  courseName: string;
  courseColor: string;
  startTime: string;
  endTime: string;
  room: string | null;
  status: AttendanceStatus | null;
  recordId: string | null;
};

/**
 * Las clases de un día con su asistencia ya marcada, si la hay.
 * Alimenta el registro de un toque desde el horario y el dashboard.
 */
export async function getSessionsForDate(
  userId: string,
  date: string,
  weekday: number,
): Promise<TodaySession[]> {
  const rows = await db
    .select({ block: courseBlocks, course: courses })
    .from(courseBlocks)
    .innerJoin(courses, eq(courseBlocks.courseId, courses.id))
    .where(
      and(
        eq(courseBlocks.userId, userId),
        eq(courseBlocks.weekday, weekday),
        isNull(courses.archivedAt),
      ),
    )
    .orderBy(courseBlocks.startTime);

  const dayRecords = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.date, date)));

  return rows.map(({ block, course }) => {
    const record = dayRecords.find((r) => r.blockId === block.id);
    return {
      blockId: block.id,
      courseId: course.id,
      courseName: course.name,
      courseColor: course.color,
      startTime: block.startTime,
      endTime: block.endTime,
      room: block.room ?? course.room,
      status: (record?.status as AttendanceStatus | undefined) ?? null,
      recordId: record?.id ?? null,
    };
  });
}
