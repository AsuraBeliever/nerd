import "server-only";
import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import {
  bodyMetrics,
  type Exercise,
  exercises,
  type Routine,
  routineExercises,
  routines,
  type User,
  type Workout,
  type WorkoutSet,
  workoutSets,
  workouts,
} from "@/db/schema";
import type { SetLike } from "./lib";

/**
 * El catálogo mezcla los ejercicios del sistema (userId NULL) con los que el
 * usuario haya creado. El filtro de equipo **oculta**, no borra: si algún día
 * se inscribe a un gimnasio, activa el equipo y aparece todo.
 */
export async function listExercises(user: User, respectEquipment = true): Promise<Exercise[]> {
  const rows = await db
    .select()
    .from(exercises)
    .where(
      and(
        or(isNull(exercises.userId), eq(exercises.userId, user.id)),
        isNull(exercises.archivedAt),
      ),
    )
    .orderBy(asc(exercises.name));

  const allowed = user.availableEquipment;
  if (!respectEquipment || !allowed || allowed.length === 0) return rows;

  return rows.filter((e) => allowed.includes(e.equipment));
}

export async function listRoutines(userId: string) {
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(routines)
      .where(and(eq(routines.userId, userId), isNull(routines.archivedAt)))
      .orderBy(asc(routines.name)),
    db.select({ routineId: routineExercises.routineId }).from(routineExercises),
  ]);

  return rows.map((routine) => ({
    ...routine,
    exerciseCount: counts.filter((c) => c.routineId === routine.id).length,
  }));
}

export type RoutineDetail = Routine & {
  items: {
    id: string;
    exercise: Exercise;
    sortOrder: number;
    targetSets: number;
    targetRepsMin: number | null;
    targetRepsMax: number | null;
    targetWeightKg: string | null;
    restSeconds: number | null;
  }[];
};

export async function getRoutine(userId: string, id: string): Promise<RoutineDetail | null> {
  const [routine] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.id, id), eq(routines.userId, userId)))
    .limit(1);
  if (!routine) return null;

  const rows = await db
    .select({ item: routineExercises, exercise: exercises })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, id))
    .orderBy(asc(routineExercises.sortOrder));

  return {
    ...routine,
    items: rows.map(({ item, exercise }) => ({
      id: item.id,
      exercise,
      sortOrder: item.sortOrder,
      targetSets: item.targetSets,
      targetRepsMin: item.targetRepsMin,
      targetRepsMax: item.targetRepsMax,
      targetWeightKg: item.targetWeightKg,
      restSeconds: item.restSeconds,
    })),
  };
}

/** La sesión abierta, si la hay. Sobrevive a cerrar la app. */
export async function getOpenWorkout(userId: string): Promise<Workout | null> {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), isNull(workouts.endedAt)))
    .orderBy(desc(workouts.startedAt))
    .limit(1);
  return workout ?? null;
}

export type WorkoutDetail = Workout & {
  sets: (WorkoutSet & { exercise: Exercise })[];
  routineName: string | null;
};

export async function getWorkout(userId: string, id: string): Promise<WorkoutDetail | null> {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .limit(1);
  if (!workout) return null;

  const rows = await db
    .select({ set: workoutSets, exercise: exercises })
    .from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(eq(workoutSets.workoutId, id))
    .orderBy(asc(workoutSets.completedAt));

  let routineName: string | null = null;
  if (workout.routineId) {
    const [routine] = await db
      .select({ name: routines.name })
      .from(routines)
      .where(eq(routines.id, workout.routineId))
      .limit(1);
    routineName = routine?.name ?? null;
  }

  return {
    ...workout,
    routineName,
    sets: rows.map(({ set, exercise }) => ({ ...set, exercise })),
  };
}

export async function listWorkouts(userId: string, limit = 30) {
  const rows = await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const sets = await db
    .select({ workoutId: workoutSets.workoutId })
    .from(workoutSets)
    .where(
      inArray(
        workoutSets.workoutId,
        rows.map((r) => r.id),
      ),
    );

  return rows.map((workout) => ({
    ...workout,
    setCount: sets.filter((s) => s.workoutId === workout.id).length,
  }));
}

/**
 * Los valores de la última vez que se hizo cada ejercicio, para precargarlos.
 * La mayoría de las veces el usuario solo tiene que confirmar.
 */
export async function lastValuesByExercise(
  userId: string,
): Promise<
  Map<string, { reps: number | null; weightKg: string | null; durationSeconds: number | null }>
> {
  const rows = await db
    .select()
    .from(workoutSets)
    .where(and(eq(workoutSets.userId, userId), eq(workoutSets.isWarmup, false)))
    .orderBy(desc(workoutSets.completedAt))
    .limit(500);

  const map = new Map<
    string,
    { reps: number | null; weightKg: string | null; durationSeconds: number | null }
  >();

  for (const row of rows) {
    if (map.has(row.exerciseId)) continue;
    map.set(row.exerciseId, {
      reps: row.reps,
      weightKg: row.weightKg,
      durationSeconds: row.durationSeconds,
    });
  }

  return map;
}

/** Peso corporal más reciente: es la carga real de los ejercicios de cuerpo. */
export async function latestBodyweightKg(userId: string): Promise<number | null> {
  const [row] = await db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(desc(bodyMetrics.date))
    .limit(1);
  return row?.weightKg ? Number(row.weightKg) : null;
}

export async function listBodyMetrics(userId: string, limit = 180) {
  return db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(asc(bodyMetrics.date))
    .limit(limit);
}

/** Todas las series del usuario, listas para las métricas de progreso. */
export async function allSets(userId: string): Promise<(SetLike & { exercise: Exercise })[]> {
  const rows = await db
    .select({ set: workoutSets, exercise: exercises })
    .from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(eq(workoutSets.userId, userId))
    .orderBy(asc(workoutSets.completedAt));

  return rows.map(({ set, exercise }) => ({
    exerciseId: set.exerciseId,
    reps: set.reps,
    weightKg: set.weightKg === null ? null : Number(set.weightKg),
    addedWeightKg: set.addedWeightKg === null ? null : Number(set.addedWeightKg),
    durationSeconds: set.durationSeconds,
    distanceM: set.distanceM,
    isWarmup: set.isWarmup,
    completedAt: set.completedAt,
    exercise,
  }));
}
