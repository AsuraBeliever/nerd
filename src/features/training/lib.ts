import type { TrackingType } from "@/db/schema";

/**
 * Métricas de progreso. Nada de esto se guarda: se calcula desde las series
 * cada vez (ADR-006), así que corregir una serie vieja arregla el historial
 * completo sin recalcular nada a mano.
 */

export type SetLike = {
  exerciseId: string;
  reps: number | null;
  weightKg: number | null;
  addedWeightKg: number | null;
  durationSeconds: number | null;
  distanceM: number | null;
  isWarmup: boolean;
  completedAt: Date;
};

/** Carga real de una serie: el peso levantado más lo que se haya añadido. */
export function loadOf(set: SetLike, bodyweightKg: number | null): number | null {
  const added = set.addedWeightKg ?? 0;
  if (set.weightKg !== null) return set.weightKg + added;
  // Peso corporal: la carga es el cuerpo, si lo conocemos.
  if (bodyweightKg !== null) return bodyweightKg + added;
  return added > 0 ? added : null;
}

/**
 * 1RM estimado por la fórmula de Epley: `peso × (1 + reps/30)`.
 *
 * Sirve para comparar honestamente 100 kg × 5 con 80 kg × 12. Solo aplica
 * donde hay carga; con puro peso corporal el progreso se mide con
 * repeticiones (ver `bestRepsSet`).
 */
export function estimatedOneRepMax(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Volumen de una serie: repeticiones por carga. El calentamiento no cuenta. */
export function volumeOf(set: SetLike, bodyweightKg: number | null): number {
  if (set.isWarmup || !set.reps) return 0;
  const load = loadOf(set, bodyweightKg);
  return load === null ? 0 : set.reps * load;
}

export type ExerciseProgressPoint = {
  date: string;
  /** La métrica que le corresponde a este tipo de ejercicio. */
  value: number;
  label: string;
};

/**
 * Serie de progreso de un ejercicio, con la métrica correcta según su tipo.
 *
 * Esto es lo que hace que el módulo sirva entrenando en casa: quien pasa de
 * 8 a 15 lagartijas progresó muchísimo, y una gráfica de kilos no lo vería.
 */
export function progressSeries(
  sets: SetLike[],
  trackingType: TrackingType,
  bodyweightKg: number | null,
): ExerciseProgressPoint[] {
  const working = sets.filter((s) => !s.isWarmup);
  const byDay = new Map<string, SetLike[]>();

  for (const set of working) {
    const day = set.completedAt.toISOString().slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), set]);
  }

  const points: ExerciseProgressPoint[] = [];

  for (const [date, daySets] of [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (trackingType === "weight_reps") {
      const best = Math.max(
        ...daySets.map((s) => {
          const load = loadOf(s, bodyweightKg);
          return load && s.reps ? (estimatedOneRepMax(load, s.reps) ?? 0) : 0;
        }),
      );
      if (best > 0) points.push({ date, value: best, label: "1RM estimado" });
    } else if (trackingType === "reps_only") {
      const best = Math.max(...daySets.map((s) => s.reps ?? 0));
      if (best > 0) points.push({ date, value: best, label: "Mejor serie (reps)" });
    } else if (trackingType === "time") {
      const best = Math.max(...daySets.map((s) => s.durationSeconds ?? 0));
      if (best > 0) points.push({ date, value: best, label: "Mejor tiempo (s)" });
    } else {
      // distancia + tiempo → ritmo en minutos por kilómetro, menos es mejor.
      const best = daySets
        .map((s) =>
          s.distanceM && s.durationSeconds ? s.durationSeconds / 60 / (s.distanceM / 1000) : null,
        )
        .filter((v): v is number => v !== null);
      if (best.length > 0) points.push({ date, value: Math.min(...best), label: "Ritmo (min/km)" });
    }
  }

  return points;
}

/** Récord personal de un ejercicio, según su tipo. */
export function personalRecord(
  sets: SetLike[],
  trackingType: TrackingType,
  bodyweightKg: number | null,
): { value: number; date: string } | null {
  const points = progressSeries(sets, trackingType, bodyweightKg);
  if (points.length === 0) return null;

  // En ritmo, el récord es el valor más bajo.
  const better = trackingType === "distance_time" ? Math.min : Math.max;
  const best = points.reduce((acc, p) => (better(acc.value, p.value) === p.value ? p : acc));
  return { value: best.value, date: best.date };
}

/** Clave ISO de la semana a la que pertenece una fecha, respetando el inicio de semana. */
export function weekKey(date: Date, weekStartsOn: number): string {
  const day = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  const offset = (day - weekStartsOn + 7) % 7;
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - offset);
  return start.toISOString().slice(0, 10);
}

export type WeeklyVolume = { week: string; volume: number; sets: number };

export function weeklyVolume(
  sets: SetLike[],
  weekStartsOn: number,
  bodyweightKg: number | null,
): WeeklyVolume[] {
  const byWeek = new Map<string, { volume: number; sets: number }>();

  for (const set of sets) {
    if (set.isWarmup) continue;
    const week = weekKey(set.completedAt, weekStartsOn);
    const current = byWeek.get(week) ?? { volume: 0, sets: 0 };
    byWeek.set(week, {
      volume: current.volume + volumeOf(set, bodyweightKg),
      sets: current.sets + 1,
    });
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, v]) => ({ week, ...v }));
}

/** Semanas seguidas con al menos un entrenamiento, contando hacia atrás desde hoy. */
export function currentStreak(weeks: string[], weekStartsOn: number, now = new Date()): number {
  if (weeks.length === 0) return 0;

  const set = new Set(weeks);
  let streak = 0;
  const cursor = new Date(now);

  // Se permite que la semana en curso todavía no tenga entrenamiento.
  if (!set.has(weekKey(cursor, weekStartsOn))) {
    cursor.setUTCDate(cursor.getUTCDate() - 7);
    if (!set.has(weekKey(cursor, weekStartsOn))) return 0;
  }

  while (set.has(weekKey(cursor, weekStartsOn))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }

  return streak;
}

export type Trend = {
  direction: "up" | "flat" | "down" | "unknown";
  changePct: number | null;
  recentVolume: number;
  previousVolume: number;
};

/**
 * Últimas 4 semanas contra las 4 anteriores.
 *
 * Con menos de 8 semanas de historia se dice que no hay datos suficientes,
 * en vez de inventar un veredicto sobre dos entrenamientos.
 */
export function volumeTrend(weekly: WeeklyVolume[]): Trend {
  if (weekly.length < 8) {
    return { direction: "unknown", changePct: null, recentVolume: 0, previousVolume: 0 };
  }

  const recent = weekly.slice(-4).reduce((sum, w) => sum + w.volume, 0);
  const previous = weekly.slice(-8, -4).reduce((sum, w) => sum + w.volume, 0);

  if (previous === 0) {
    return { direction: "unknown", changePct: null, recentVolume: recent, previousVolume: 0 };
  }

  const changePct = ((recent - previous) / previous) * 100;
  const direction = changePct > 5 ? "up" : changePct < -5 ? "down" : "flat";

  return { direction, changePct, recentVolume: recent, previousVolume: previous };
}

export const TREND_LABEL: Record<Trend["direction"], string> = {
  up: "subiendo",
  flat: "estable",
  down: "bajando",
  unknown: "sin datos suficientes",
};
