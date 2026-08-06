import { timeToMinutes } from "@/lib/dates";

export type BlockLike = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
};

/** Dos bloques chocan si son el mismo día y sus rangos se cruzan. */
export function blocksOverlap(a: BlockLike, b: BlockLike): boolean {
  if (a.weekday !== b.weekday) return false;
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  // Terminar justo cuando otra empieza no es un choque.
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Bloques existentes que chocan con uno nuevo. No bloquea el guardado:
 * puede haber traslapes legítimos y decidir por el usuario sería presuntuoso.
 */
export function findOverlaps<T extends BlockLike>(candidate: BlockLike, existing: T[]): T[] {
  return existing.filter((b) => b.id !== candidate.id && blocksOverlap(candidate, b));
}

export type ClassStatus<T> =
  | { kind: "in-class"; block: T; minutesLeft: number }
  | { kind: "upcoming"; block: T; minutesUntil: number }
  | { kind: "done" };

/**
 * Qué clase hay ahora y cuál sigue, dado el día y la hora del usuario.
 * Es la pregunta que la app debe contestar en menos de 3 segundos.
 */
export function currentClassStatus<T extends BlockLike>(
  blocks: T[],
  weekday: number,
  minutesNow: number,
): ClassStatus<T> {
  const today = blocks
    .filter((b) => b.weekday === weekday)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  for (const block of today) {
    const start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    if (minutesNow >= start && minutesNow < end) {
      return { kind: "in-class", block, minutesLeft: end - minutesNow };
    }
    if (minutesNow < start) {
      return { kind: "upcoming", block, minutesUntil: start - minutesNow };
    }
  }

  return { kind: "done" };
}

/** Bloques de un día, ya ordenados por hora. */
export function blocksOfDay<T extends BlockLike>(blocks: T[], weekday: number): T[] {
  return blocks
    .filter((b) => b.weekday === weekday)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

/**
 * Qué días mostrar en la cuadrícula.
 *
 * Por defecto se deducen de los bloques: no tiene caso ocupar espacio con
 * días vacíos. Pero si el usuario fijó sus días visibles, mandan los suyos
 * — incluidos los vacíos, por si quiere ver el sábado aunque hoy no tenga
 * clase (ADR-012).
 */
export function visibleWeekdays(
  blocks: BlockLike[],
  preference: number[] | null,
  weekOrder: number[],
): number[] {
  if (preference && preference.length > 0) {
    return weekOrder.filter((d) => preference.includes(d));
  }
  const withClasses = new Set(blocks.map((b) => b.weekday));
  const days = weekOrder.filter((d) => withClasses.has(d));
  return days.length > 0 ? days : weekOrder.slice(0, 5);
}

/**
 * Rango horario de la cuadrícula: sale de las clases del usuario, no de un
 * 0-24 fijo. Se redondea a horas completas y se deja un margen.
 */
export function gridTimeRange(
  blocks: BlockLike[],
  fallback = { start: 7 * 60, end: 21 * 60 },
): { startMinutes: number; endMinutes: number } {
  if (blocks.length === 0) return { startMinutes: fallback.start, endMinutes: fallback.end };

  const starts = blocks.map((b) => timeToMinutes(b.startTime));
  const ends = blocks.map((b) => timeToMinutes(b.endTime));

  const startMinutes = Math.floor(Math.min(...starts) / 60) * 60;
  const endMinutes = Math.ceil(Math.max(...ends) / 60) * 60;

  return { startMinutes, endMinutes: Math.max(endMinutes, startMinutes + 60) };
}

/** Cuántas sesiones semanales tiene una materia (para estimar la asistencia). */
export function sessionsPerWeek(blocks: BlockLike[]): number {
  return blocks.length;
}
