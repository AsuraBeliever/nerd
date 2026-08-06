import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { type User, workouts } from "@/db/schema";
import { getAttendanceByCourse, getSessionsForDate } from "@/features/attendance/queries";
import { getSchedule } from "@/features/courses/queries";
import { listDueBetween, listTasks } from "@/features/tasks/queries";
import { dayBoundsIn, todayIn, weekdayIn } from "@/lib/dates";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Todo lo que el dashboard necesita, en un solo viaje.
 *
 * Es la pantalla más visitada: las consultas se lanzan en paralelo para que
 * el contenido aparezca en un solo render.
 */
export async function getDashboard(user: User, now: Date = new Date()) {
  const date = todayIn(user.timezone, now);
  const weekday = weekdayIn(user.timezone, now);
  const { start, end } = dayBoundsIn(user.timezone, now);

  // Después de las 8 pm interesa mañana, no lo que ya pasó hoy.
  const lookAhead = now.getTime() > end.getTime() - 4 * 60 * 60 * 1000 ? 8 : 7;

  const [schedule, sessions, dueSoon, personalToday, attendance, lastWorkout, openWorkout] =
    await Promise.all([
      getSchedule(user.id),
      getSessionsForDate(user.id, date, weekday),
      listDueBetween(user.id, new Date(0), new Date(end.getTime() + lookAhead * DAY_MS), 5),
      listTasks(user.id, { scope: "personal", limit: 50 }),
      getAttendanceByCourse(user),
      db
        .select()
        .from(workouts)
        .where(eq(workouts.userId, user.id))
        .orderBy(desc(workouts.startedAt))
        .limit(1),
      db
        .select()
        .from(workouts)
        .where(and(eq(workouts.userId, user.id), isNull(workouts.endedAt)))
        .limit(1),
    ]);

  // Pendientes personales de hoy o ya vencidos.
  const personalDue = personalToday.filter((t) => t.dueAt && t.dueAt.getTime() <= end.getTime());

  // Solo se avisa de materias en riesgo real; si va holgado, no se dice nada.
  const atRisk = attendance.filter(
    (a) => a.summary.level === "critical" || a.summary.level === "exceeded",
  );

  return {
    date,
    weekday,
    schedule,
    sessions,
    dueSoon,
    personalDue,
    atRisk,
    lastWorkout: lastWorkout[0] ?? null,
    openWorkout: openWorkout[0] ?? null,
    startOfDay: start,
  };
}
