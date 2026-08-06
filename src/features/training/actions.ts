"use server";

import { and, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  bodyMetrics,
  exercises,
  routineExercises,
  routines,
  workoutSets,
  workouts,
} from "@/db/schema";
import { type ActionResult, fail, ok, parseOrFail } from "@/lib/action";
import { requireUserId } from "@/lib/session";

function refresh() {
  revalidatePath("/", "layout");
}

const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Ponle nombre al ejercicio").max(120),
  muscleGroup: z.enum([
    "chest",
    "back",
    "legs",
    "shoulders",
    "arms",
    "core",
    "cardio",
    "full_body",
  ]),
  equipment: z.enum([
    "bodyweight",
    "dumbbell",
    "resistance_band",
    "kettlebell",
    "pullup_bar",
    "barbell",
    "machine",
    "cable",
    "other",
  ]),
  trackingType: z.enum(["weight_reps", "reps_only", "time", "distance_time"]),
  allowsAddedWeight: z.boolean().catch(false),
});

export async function createExercise(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = parseOrFail(exerciseSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  const [exercise] = await db
    .insert(exercises)
    .values({ ...parsed.data, userId })
    .returning({ id: exercises.id });

  if (!exercise) return fail("No se pudo crear el ejercicio");
  refresh();
  return ok(exercise);
}

// --- Rutinas ---

const routineSchema = z.object({
  name: z.string().trim().min(1, "Ponle nombre a la rutina").max(80),
  description: z.string().trim().max(500).nullable().catch(null),
});

export async function createRoutine(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = parseOrFail(routineSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  const [routine] = await db
    .insert(routines)
    .values({ ...parsed.data, userId })
    .returning({ id: routines.id });

  if (!routine) return fail("No se pudo crear la rutina");
  refresh();
  return ok(routine);
}

export async function updateRoutine(id: string, input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(routineSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  const result = await db
    .update(routines)
    .set(parsed.data)
    .where(and(eq(routines.id, id), eq(routines.userId, userId)))
    .returning({ id: routines.id });

  if (result.length === 0) return fail("No se encontró la rutina");
  refresh();
  return ok(undefined);
}

export async function deleteRoutine(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await db
    .delete(routines)
    .where(and(eq(routines.id, id), eq(routines.userId, userId)))
    .returning({ id: routines.id });

  if (result.length === 0) return fail("No se encontró la rutina");
  refresh();
  return ok(undefined);
}

async function ownsRoutine(userId: string, routineId: string) {
  const [routine] = await db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
    .limit(1);
  return Boolean(routine);
}

const routineItemSchema = z.object({
  routineId: z.uuid(),
  exerciseId: z.uuid(),
  targetSets: z.coerce.number().int().min(1).max(20),
  targetRepsMin: z.coerce.number().int().min(1).max(200).nullable().catch(null),
  targetRepsMax: z.coerce.number().int().min(1).max(200).nullable().catch(null),
  targetWeightKg: z.coerce.number().min(0).max(1000).nullable().catch(null),
  restSeconds: z.coerce.number().int().min(0).max(900).nullable().catch(null),
});

export async function addRoutineExercise(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(routineItemSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  if (!(await ownsRoutine(userId, parsed.data.routineId))) return fail("No se encontró la rutina");

  const [{ value: lastOrder } = { value: null }] = await db
    .select({ value: max(routineExercises.sortOrder) })
    .from(routineExercises)
    .where(eq(routineExercises.routineId, parsed.data.routineId));

  await db.insert(routineExercises).values({
    ...parsed.data,
    targetWeightKg: parsed.data.targetWeightKg?.toString() ?? null,
    sortOrder: (lastOrder ?? 0) + 1,
  });

  refresh();
  return ok(undefined);
}

export async function removeRoutineExercise(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const [row] = await db
    .select({ routineId: routineExercises.routineId })
    .from(routineExercises)
    .where(eq(routineExercises.id, id))
    .limit(1);
  if (!row || !(await ownsRoutine(userId, row.routineId)))
    return fail("No se encontró el ejercicio");

  await db.delete(routineExercises).where(eq(routineExercises.id, id));
  refresh();
  return ok(undefined);
}

// --- Sesiones ---

/** Solo puede haber una sesión abierta: si ya hay una, se continúa esa. */
export async function startWorkout(
  routineId: string | null,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();

  const [open] = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), isNull(workouts.endedAt)))
    .limit(1);
  if (open) return ok(open);

  if (routineId && !(await ownsRoutine(userId, routineId))) return fail("No se encontró la rutina");

  const [workout] = await db
    .insert(workouts)
    .values({ userId, routineId })
    .returning({ id: workouts.id });

  if (!workout) return fail("No se pudo iniciar la sesión");
  refresh();
  return ok(workout);
}

const setSchema = z.object({
  workoutId: z.uuid(),
  exerciseId: z.uuid(),
  reps: z.coerce.number().int().min(0).max(1000).nullable().catch(null),
  /** Siempre en kg: la conversión ocurre en la interfaz (ADR-011). */
  weightKg: z.coerce.number().min(0).max(1000).nullable().catch(null),
  addedWeightKg: z.coerce.number().min(0).max(500).nullable().catch(null),
  durationSeconds: z.coerce.number().int().min(0).max(86400).nullable().catch(null),
  distanceM: z.coerce.number().int().min(0).max(1000000).nullable().catch(null),
  isWarmup: z.boolean().catch(false),
});

export async function logSet(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = parseOrFail(setSchema, input);
  if (!parsed.ok) return fail(parsed.error);
  const data = parsed.data;

  const [workout] = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(and(eq(workouts.id, data.workoutId), eq(workouts.userId, userId)))
    .limit(1);
  if (!workout) return fail("No se encontró la sesión");

  const [{ value: lastNumber } = { value: null }] = await db
    .select({ value: max(workoutSets.setNumber) })
    .from(workoutSets)
    .where(
      and(eq(workoutSets.workoutId, data.workoutId), eq(workoutSets.exerciseId, data.exerciseId)),
    );

  const [set] = await db
    .insert(workoutSets)
    .values({
      workoutId: data.workoutId,
      exerciseId: data.exerciseId,
      userId,
      setNumber: (lastNumber ?? 0) + 1,
      reps: data.reps,
      weightKg: data.weightKg?.toString() ?? null,
      addedWeightKg: data.addedWeightKg?.toString() ?? null,
      durationSeconds: data.durationSeconds,
      distanceM: data.distanceM,
      isWarmup: data.isWarmup,
    })
    .returning({ id: workoutSets.id });

  if (!set) return fail("No se pudo registrar la serie");
  refresh();
  return ok(set);
}

export async function deleteSet(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await db
    .delete(workoutSets)
    .where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)))
    .returning({ id: workoutSets.id });

  if (result.length === 0) return fail("No se encontró la serie");
  refresh();
  return ok(undefined);
}

export async function finishWorkout(id: string, notes?: string | null): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await db
    .update(workouts)
    .set({ endedAt: new Date(), notes: notes?.trim() || null })
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning({ id: workouts.id });

  if (result.length === 0) return fail("No se encontró la sesión");
  refresh();
  return ok(undefined);
}

export async function deleteWorkout(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await db
    .delete(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning({ id: workouts.id });

  if (result.length === 0) return fail("No se encontró la sesión");
  refresh();
  return ok(undefined);
}

const bodyMetricSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  weightKg: z.coerce.number().min(1).max(500),
});

/** Un registro por día: volver a pesarse el mismo día corrige el anterior. */
export async function recordBodyweight(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = parseOrFail(bodyMetricSchema, input);
  if (!parsed.ok) return fail(parsed.error);

  const [existing] = await db
    .select({ id: bodyMetrics.id })
    .from(bodyMetrics)
    .where(and(eq(bodyMetrics.userId, userId), eq(bodyMetrics.date, parsed.data.date)))
    .limit(1);

  if (existing) {
    await db
      .update(bodyMetrics)
      .set({ weightKg: parsed.data.weightKg.toString() })
      .where(eq(bodyMetrics.id, existing.id));
  } else {
    await db.insert(bodyMetrics).values({
      userId,
      date: parsed.data.date,
      weightKg: parsed.data.weightKg.toString(),
    });
  }

  refresh();
  return ok(undefined);
}
