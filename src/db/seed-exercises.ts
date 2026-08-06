import type { Equipment, MuscleGroup, TrackingType } from "./schema";

export type SeedExercise = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  trackingType: TrackingType;
  allowsAddedWeight?: boolean;
};

/**
 * Catálogo precargado, en español.
 *
 * El cliente entrena en casa con puro peso corporal, así que ese es el caso
 * principal: los ejercicios básicos van primero y no necesitan nada. Los de
 * gimnasio se precargan igual, pero quedan ocultos tras el filtro de equipo
 * hasta que alguien los active (ADR-012).
 */
export const SEED_EXERCISES: SeedExercise[] = [
  // --- Peso corporal: lo básico, sin nada de equipo ---
  { name: "Lagartijas", muscleGroup: "chest", equipment: "bodyweight", trackingType: "reps_only", allowsAddedWeight: true },
  { name: "Lagartijas diamante", muscleGroup: "arms", equipment: "bodyweight", trackingType: "reps_only", allowsAddedWeight: true },
  { name: "Lagartijas inclinadas", muscleGroup: "chest", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Lagartijas declinadas", muscleGroup: "chest", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Sentadillas", muscleGroup: "legs", equipment: "bodyweight", trackingType: "reps_only", allowsAddedWeight: true },
  { name: "Sentadilla búlgara", muscleGroup: "legs", equipment: "bodyweight", trackingType: "reps_only", allowsAddedWeight: true },
  { name: "Sentadilla a una pierna", muscleGroup: "legs", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Zancadas", muscleGroup: "legs", equipment: "bodyweight", trackingType: "reps_only", allowsAddedWeight: true },
  { name: "Puente de glúteo", muscleGroup: "legs", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Elevación de talones", muscleGroup: "legs", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Fondos en silla", muscleGroup: "arms", equipment: "bodyweight", trackingType: "reps_only", allowsAddedWeight: true },
  { name: "Plancha", muscleGroup: "core", equipment: "bodyweight", trackingType: "time" },
  { name: "Plancha lateral", muscleGroup: "core", equipment: "bodyweight", trackingType: "time" },
  { name: "Abdominales", muscleGroup: "core", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Elevación de piernas", muscleGroup: "core", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Escaladores", muscleGroup: "core", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Bicicleta abdominal", muscleGroup: "core", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Superman", muscleGroup: "back", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Burpees", muscleGroup: "full_body", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Saltos de tijera", muscleGroup: "cardio", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Sentadilla con salto", muscleGroup: "legs", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Pica (pike push-up)", muscleGroup: "shoulders", equipment: "bodyweight", trackingType: "reps_only" },
  { name: "Remo invertido", muscleGroup: "back", equipment: "bodyweight", trackingType: "reps_only", allowsAddedWeight: true },
  { name: "Hollow hold", muscleGroup: "core", equipment: "bodyweight", trackingType: "time" },
  { name: "Sentadilla isométrica en pared", muscleGroup: "legs", equipment: "bodyweight", trackingType: "time" },

  // --- Barra de dominadas ---
  { name: "Dominadas", muscleGroup: "back", equipment: "pullup_bar", trackingType: "reps_only", allowsAddedWeight: true },
  { name: "Dominadas supinas", muscleGroup: "arms", equipment: "pullup_bar", trackingType: "reps_only", allowsAddedWeight: true },
  { name: "Colgado en barra", muscleGroup: "back", equipment: "pullup_bar", trackingType: "time" },

  // --- Mancuernas ---
  { name: "Press de banca con mancuernas", muscleGroup: "chest", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Press militar con mancuernas", muscleGroup: "shoulders", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Remo con mancuerna", muscleGroup: "back", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Curl de bíceps", muscleGroup: "arms", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Curl martillo", muscleGroup: "arms", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Extensión de tríceps", muscleGroup: "arms", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Elevaciones laterales", muscleGroup: "shoulders", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Aperturas con mancuernas", muscleGroup: "chest", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Peso muerto con mancuernas", muscleGroup: "legs", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Sentadilla goblet", muscleGroup: "legs", equipment: "dumbbell", trackingType: "weight_reps" },
  { name: "Encogimiento de hombros", muscleGroup: "back", equipment: "dumbbell", trackingType: "weight_reps" },

  // --- Bandas de resistencia ---
  { name: "Remo con banda", muscleGroup: "back", equipment: "resistance_band", trackingType: "reps_only" },
  { name: "Jalón con banda", muscleGroup: "back", equipment: "resistance_band", trackingType: "reps_only" },
  { name: "Press de pecho con banda", muscleGroup: "chest", equipment: "resistance_band", trackingType: "reps_only" },
  { name: "Curl con banda", muscleGroup: "arms", equipment: "resistance_band", trackingType: "reps_only" },
  { name: "Abducción de cadera con banda", muscleGroup: "legs", equipment: "resistance_band", trackingType: "reps_only" },
  { name: "Face pull con banda", muscleGroup: "shoulders", equipment: "resistance_band", trackingType: "reps_only" },

  // --- Kettlebell ---
  { name: "Swing con kettlebell", muscleGroup: "full_body", equipment: "kettlebell", trackingType: "weight_reps" },
  { name: "Goblet squat con kettlebell", muscleGroup: "legs", equipment: "kettlebell", trackingType: "weight_reps" },
  { name: "Turkish get-up", muscleGroup: "full_body", equipment: "kettlebell", trackingType: "weight_reps" },

  // --- Gimnasio: barra ---
  { name: "Press de banca", muscleGroup: "chest", equipment: "barbell", trackingType: "weight_reps" },
  { name: "Press inclinado", muscleGroup: "chest", equipment: "barbell", trackingType: "weight_reps" },
  { name: "Sentadilla con barra", muscleGroup: "legs", equipment: "barbell", trackingType: "weight_reps" },
  { name: "Peso muerto", muscleGroup: "back", equipment: "barbell", trackingType: "weight_reps" },
  { name: "Press militar", muscleGroup: "shoulders", equipment: "barbell", trackingType: "weight_reps" },
  { name: "Remo con barra", muscleGroup: "back", equipment: "barbell", trackingType: "weight_reps" },
  { name: "Hip thrust", muscleGroup: "legs", equipment: "barbell", trackingType: "weight_reps" },

  // --- Gimnasio: máquinas y poleas ---
  { name: "Jalón al pecho", muscleGroup: "back", equipment: "cable", trackingType: "weight_reps" },
  { name: "Remo en polea", muscleGroup: "back", equipment: "cable", trackingType: "weight_reps" },
  { name: "Extensión de tríceps en polea", muscleGroup: "arms", equipment: "cable", trackingType: "weight_reps" },
  { name: "Prensa de piernas", muscleGroup: "legs", equipment: "machine", trackingType: "weight_reps" },
  { name: "Extensión de cuádriceps", muscleGroup: "legs", equipment: "machine", trackingType: "weight_reps" },
  { name: "Curl femoral", muscleGroup: "legs", equipment: "machine", trackingType: "weight_reps" },

  // --- Cardio ---
  { name: "Correr", muscleGroup: "cardio", equipment: "bodyweight", trackingType: "distance_time" },
  { name: "Caminar", muscleGroup: "cardio", equipment: "bodyweight", trackingType: "distance_time" },
  { name: "Cuerda para saltar", muscleGroup: "cardio", equipment: "other", trackingType: "time" },
];
