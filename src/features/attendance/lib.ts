import type { AttendanceStatus } from "@/db/schema";

/**
 * Todo el cálculo de asistencia. Es lógica pura y probada: de aquí sale la
 * cifra que el cliente pidió — cuántas faltas le quedan.
 *
 * Ninguna regla está fija: qué cuenta como asistencia y si existen los
 * retardos son preferencias del usuario (ADR-012).
 */

export type AttendanceRules = {
  /** Mínimo requerido, en porcentaje (80 = 80%). */
  minPct: number;
  /** ¿Las justificadas cuentan como asistencia? El cliente: sí. */
  excusedCountsAsPresent: boolean;
  /** ¿Se registran retardos? El cliente: no. */
  trackLates: boolean;
  /** "N retardos = 1 falta". Null = los retardos no suman faltas. */
  latesPerAbsence: number | null;
};

export type StatusCount = Record<AttendanceStatus, number>;

export function countStatuses(statuses: AttendanceStatus[]): StatusCount {
  const counts: StatusCount = { present: 0, absent: 0, late: 0, excused: 0, cancelled: 0 };
  for (const s of statuses) counts[s] += 1;
  return counts;
}

/** Sesiones que entran al cálculo: las canceladas salen del denominador. */
export function consideredSessions(counts: StatusCount): number {
  return counts.present + counts.absent + counts.late + counts.excused;
}

/** Faltas que de verdad cuentan, aplicando la regla de retardos si está activa. */
export function effectiveAbsences(counts: StatusCount, rules: AttendanceRules): number {
  const fromLates =
    rules.trackLates && rules.latesPerAbsence && rules.latesPerAbsence > 0
      ? Math.floor(counts.late / rules.latesPerAbsence)
      : 0;

  const excusedAsAbsence = rules.excusedCountsAsPresent ? 0 : counts.excused;

  return counts.absent + fromLates + excusedAsAbsence;
}

/** Porcentaje de asistencia actual. Null si todavía no hay sesiones. */
export function attendancePct(counts: StatusCount, rules: AttendanceRules): number | null {
  const total = consideredSessions(counts);
  if (total === 0) return null;

  const attended = counts.present + (rules.excusedCountsAsPresent ? counts.excused : 0);
  // Un retardo que no llega a falta cuenta como asistencia.
  const lateCredit = rules.trackLates ? counts.late - lateAbsences(counts, rules) : counts.late;

  return ((attended + lateCredit) / total) * 100;
}

function lateAbsences(counts: StatusCount, rules: AttendanceRules): number {
  if (!rules.trackLates || !rules.latesPerAbsence || rules.latesPerAbsence <= 0) return 0;
  return Math.floor(counts.late / rules.latesPerAbsence);
}

/**
 * Sesiones totales estimadas del semestre: bloques por semana × semanas.
 * Si el usuario fijó un total a mano, ese manda.
 */
export function estimateTotalSessions({
  blocksPerWeek,
  startDate,
  endDate,
  override,
}: {
  blocksPerWeek: number;
  startDate: string | null;
  endDate: string | null;
  override: number | null;
}): number | null {
  if (override && override > 0) return override;
  if (!startDate || !endDate || blocksPerWeek === 0) return null;

  const start = new Date(`${startDate}T12:00:00Z`).getTime();
  const end = new Date(`${endDate}T12:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const weeks = Math.round((end - start) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(weeks * blocksPerWeek, blocksPerWeek);
}

/**
 * Faltas máximas permitidas antes de rebasar el mínimo.
 *
 * Se calcula con enteros (puntos base) a propósito: con flotantes,
 * `30 * (1 - 90/100)` da 2.9999999999999996 y el redondeo hacia abajo
 * le quitaría una falta al usuario sin razón.
 */
export function maxAllowedAbsences(totalSessions: number, minPct: number): number {
  const minBasisPoints = Math.round(minPct * 100);
  return Math.floor((totalSessions * (10000 - minBasisPoints)) / 10000);
}

export type AttendanceSummary = {
  counts: StatusCount;
  considered: number;
  absences: number;
  currentPct: number | null;
  totalSessions: number | null;
  maxAbsences: number | null;
  /** La cifra que importa. Null si no se puede estimar el total. */
  remaining: number | null;
  level: "none" | "safe" | "warning" | "critical" | "exceeded";
};

/**
 * Semáforo: neutro, holgado, cuidado, al límite, rebasado.
 *
 * Manda **cuántas faltas quedan**, no el porcentaje de hoy. La diferencia
 * importa: quien falta 4 veces en las primeras 14 clases va al 71% en este
 * momento, pero con 32 sesiones en el semestre todavía puede terminar al
 * 87%. Pintarlo de rojo sería mentirle. El porcentaje corriente solo decide
 * cuando no se puede estimar el total del semestre.
 */
export function riskLevel(
  remaining: number | null,
  currentPct: number | null,
  minPct: number,
): AttendanceSummary["level"] {
  if (remaining !== null) {
    if (remaining < 0) return "exceeded";
    if (remaining <= 1) return "critical";
    if (remaining <= 3) return "warning";
    return "safe";
  }

  if (currentPct === null) return "none";
  return currentPct < minPct ? "exceeded" : "safe";
}

export function summarize({
  statuses,
  rules,
  blocksPerWeek,
  startDate,
  endDate,
  override,
}: {
  statuses: AttendanceStatus[];
  rules: AttendanceRules;
  blocksPerWeek: number;
  startDate: string | null;
  endDate: string | null;
  override: number | null;
}): AttendanceSummary {
  const counts = countStatuses(statuses);
  const considered = consideredSessions(counts);
  const absences = effectiveAbsences(counts, rules);
  const currentPct = attendancePct(counts, rules);
  const totalSessions = estimateTotalSessions({ blocksPerWeek, startDate, endDate, override });
  const maxAbsences =
    totalSessions === null ? null : maxAllowedAbsences(totalSessions, rules.minPct);
  const remaining = maxAbsences === null ? null : maxAbsences - absences;

  return {
    counts,
    considered,
    absences,
    currentPct,
    totalSessions,
    maxAbsences,
    remaining,
    level: riskLevel(remaining, currentPct, rules.minPct),
  };
}
