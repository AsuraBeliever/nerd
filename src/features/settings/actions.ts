"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  attendanceRecords,
  bodyMetrics,
  courseBlocks,
  courses,
  exercises,
  routineExercises,
  routines,
  subtasks,
  tasks,
  terms,
  users,
  workoutSets,
  workouts,
} from "@/db/schema";
import { type ActionResult, fail, ok, parseOrFail } from "@/lib/action";
import { requireUserId } from "@/lib/session";

const EQUIPMENT = [
  "bodyweight",
  "dumbbell",
  "resistance_band",
  "kettlebell",
  "pullup_bar",
  "barbell",
  "machine",
  "cable",
  "other",
] as const;

/**
 * Todas las preferencias del usuario en un solo esquema.
 *
 * Cada campo de aquí existe porque alguien podría querer la app distinta a
 * como la quiere el cliente de hoy (ADR-012).
 */
const settingsSchema = z.object({
  timezone: z.string().min(1).max(64),
  weekStartsOn: z.coerce.number().int().min(1).max(7),
  visibleWeekdays: z.array(z.coerce.number().int().min(1).max(7)).nullable().catch(null),
  theme: z.enum(["system", "light", "dark"]),

  defaultMinAttendancePct: z.coerce.number().min(0).max(100),
  excusedCountsAsPresent: z.boolean(),
  trackLates: z.boolean(),
  latesPerAbsence: z.coerce.number().int().min(2).max(10).nullable().catch(null),

  trackGrades: z.boolean(),

  weightUnit: z.enum(["kg", "lb"]),
  availableEquipment: z.array(z.enum(EQUIPMENT)).nullable().catch(null),
});

export async function updateSettings(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(settingsSchema, input);
  if (!parsed.ok) return fail(parsed.error);
  const data = parsed.data;

  await db
    .update(users)
    .set({
      timezone: data.timezone,
      weekStartsOn: data.weekStartsOn,
      visibleWeekdays: data.visibleWeekdays?.length ? data.visibleWeekdays : null,
      theme: data.theme,
      defaultMinAttendancePct: data.defaultMinAttendancePct.toFixed(2),
      excusedCountsAsPresent: data.excusedCountsAsPresent,
      trackLates: data.trackLates,
      // La regla de retardos no tiene sentido si los retardos están apagados.
      latesPerAbsence: data.trackLates ? data.latesPerAbsence : null,
      trackGrades: data.trackGrades,
      weightUnit: data.weightUnit,
      availableEquipment: data.availableEquipment?.length ? data.availableEquipment : null,
    })
    .where(eq(users.id, userId));

  revalidatePath("/", "layout");
  return ok(undefined);
}

/** Los datos son del usuario: se los puede llevar completos, sin pedir permiso. */
export async function exportData(): Promise<ActionResult<string>> {
  const userId = await requireUserId();

  const [
    user,
    userTerms,
    userCourses,
    blocks,
    attendance,
    userTasks,
    userSubtasks,
    userExercises,
    userRoutines,
    userRoutineExercises,
    userWorkouts,
    sets,
    metrics,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(terms).where(eq(terms.userId, userId)),
    db.select().from(courses).where(eq(courses.userId, userId)),
    db.select().from(courseBlocks).where(eq(courseBlocks.userId, userId)),
    db.select().from(attendanceRecords).where(eq(attendanceRecords.userId, userId)),
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db.select().from(subtasks),
    db.select().from(exercises).where(eq(exercises.userId, userId)),
    db.select().from(routines).where(eq(routines.userId, userId)),
    db.select().from(routineExercises),
    db.select().from(workouts).where(eq(workouts.userId, userId)),
    db.select().from(workoutSets).where(eq(workoutSets.userId, userId)),
    db.select().from(bodyMetrics).where(eq(bodyMetrics.userId, userId)),
  ]);

  const taskIds = new Set(userTasks.map((t) => t.id));
  const routineIds = new Set(userRoutines.map((r) => r.id));
  const account = user[0];

  return ok(
    JSON.stringify(
      {
        exportadoEl: new Date().toISOString(),
        usuario: account ? { ...account, id: undefined } : null,
        semestres: userTerms,
        materias: userCourses,
        horario: blocks,
        asistencia: attendance,
        tareas: userTasks,
        subtareas: userSubtasks.filter((s) => taskIds.has(s.taskId)),
        ejerciciosPropios: userExercises,
        rutinas: userRoutines,
        ejerciciosDeRutina: userRoutineExercises.filter((r) => routineIds.has(r.routineId)),
        entrenamientos: userWorkouts,
        series: sets,
        pesoCorporal: metrics,
      },
      null,
      2,
    ),
  );
}

/** Borrar la cuenta borra todo de verdad: las claves foráneas van en cascada. */
export async function deleteAccount(confirmation: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (confirmation !== "BORRAR") return fail('Escribe "BORRAR" para confirmar');

  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/", "layout");
  return ok(undefined);
}
