import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const muscleGroupEnum = pgEnum("muscle_group", [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "cardio",
  "full_body",
]);

/** Ordenado de "no necesito nada" a "necesito un gimnasio". */
export const equipmentEnum = pgEnum("equipment", [
  "bodyweight",
  "dumbbell",
  "resistance_band",
  "kettlebell",
  "pullup_bar",
  "barbell",
  "machine",
  "cable",
  "other",
]);

/** Decide qué campos se piden al registrar y cómo se mide el progreso. */
export const trackingTypeEnum = pgEnum("tracking_type", [
  "weight_reps",
  "reps_only",
  "time",
  "distance_time",
]);

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** NULL = ejercicio precargado del sistema, de solo lectura. */
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    muscleGroup: muscleGroupEnum("muscle_group").notNull(),
    equipment: equipmentEnum("equipment").notNull(),
    trackingType: trackingTypeEnum("tracking_type").notNull(),
    /** Peso corporal al que se le puede añadir carga (chaleco, mochila). */
    allowsAddedWeight: boolean("allows_added_weight").notNull().default(false),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [index("exercises_user_idx").on(t.userId)],
);

export const routines = pgTable(
  "routines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("routines_user_idx").on(t.userId)],
);

export const routineExercises = pgTable(
  "routine_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
    targetSets: smallint("target_sets").notNull().default(3),
    targetRepsMin: smallint("target_reps_min"),
    targetRepsMax: smallint("target_reps_max"),
    /** Siempre en kg: la unidad del usuario es solo visualización (ADR-011). */
    targetWeightKg: numeric("target_weight_kg", { precision: 6, scale: 2 }),
    targetDurationSeconds: integer("target_duration_seconds"),
    restSeconds: smallint("rest_seconds"),
  },
  (t) => [index("routine_exercises_routine_idx").on(t.routineId, t.sortOrder)],
);

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** SET NULL: borrar la rutina no borra el historial. */
    routineId: uuid("routine_id").references(() => routines.id, { onDelete: "set null" }),
    name: text("name"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    /** NULL = sesión en curso. */
    endedAt: timestamp("ended_at", { withTimezone: true }),
    notes: text("notes"),
    perceivedEffort: smallint("perceived_effort"),
  },
  (t) => [index("workouts_user_started_idx").on(t.userId, t.startedAt)],
);

/** La tabla más importante del módulo: de aquí sale todo el progreso. */
export const workoutSets = pgTable(
  "workout_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    /** Denormalizado: hace baratos los agregados de progreso. */
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    setNumber: smallint("set_number").notNull().default(1),
    reps: smallint("reps"),
    /** numeric, no float: 22.5 kg debe ser exactamente 22.5. */
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
    addedWeightKg: numeric("added_weight_kg", { precision: 6, scale: 2 }),
    durationSeconds: integer("duration_seconds"),
    distanceM: integer("distance_m"),
    rpe: numeric("rpe", { precision: 3, scale: 1 }),
    /** El calentamiento no cuenta en ninguna estadística. */
    isWarmup: boolean("is_warmup").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("workout_sets_progress_idx").on(t.userId, t.exerciseId, t.completedAt),
    index("workout_sets_workout_idx").on(t.workoutId),
  ],
);

export const bodyMetrics = pgTable(
  "body_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    bodyFatPct: numeric("body_fat_pct", { precision: 4, scale: 1 }),
    notes: text("notes"),
  },
  (t) => [unique("body_metrics_unique_day").on(t.userId, t.date)],
);

export type Exercise = typeof exercises.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type MuscleGroup = (typeof muscleGroupEnum.enumValues)[number];
export type Equipment = (typeof equipmentEnum.enumValues)[number];
export type TrackingType = (typeof trackingTypeEnum.enumValues)[number];
