import { TZDate } from "@date-fns/tz";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Regla del proyecto: se guarda en UTC, se muestra en la zona del usuario.
 * Todo lo que convierta entre ambos mundos vive aquí.
 */

/** "Hoy" según el usuario, no según el servidor. Formato YYYY-MM-DD. */
export function todayIn(timezone: string, now: Date = new Date()): string {
  return format(new TZDate(now, timezone), "yyyy-MM-dd");
}

/** Día de la semana ISO en la zona del usuario: 1 = lunes … 7 = domingo. */
export function weekdayIn(timezone: string, now: Date = new Date()): number {
  const day = new TZDate(now, timezone).getDay();
  return day === 0 ? 7 : day;
}

/** Minutos transcurridos del día en la zona del usuario. */
export function minutesOfDayIn(timezone: string, now: Date = new Date()): number {
  const d = new TZDate(now, timezone);
  return d.getHours() * 60 + d.getMinutes();
}

/** "07:30:00" o "07:30" → minutos desde medianoche. */
export function timeToMinutes(time: string): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "07:30:00" → "7:30 am" */
export function formatTime(time: string): string {
  const minutes = timeToMinutes(time);
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export const WEEKDAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday - 1] ?? "";
}

export function weekdayShort(weekday: number): string {
  return WEEKDAY_SHORT[weekday - 1] ?? "";
}

export type Urgency = "overdue" | "today" | "tomorrow" | "this-week" | "later" | "no-date";

/** Clasifica una fecha de entrega según qué tan urgente es, en la zona del usuario. */
export function urgencyOf(dueAt: Date | null, timezone: string, now: Date = new Date()): Urgency {
  if (!dueAt) return "no-date";
  const due = startOfDay(new TZDate(dueAt, timezone));
  const today = startOfDay(new TZDate(now, timezone));
  const days = differenceInCalendarDays(due, today);

  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return "this-week";
  return "later";
}

/** Fecha en lenguaje natural: "hoy", "mañana", "en 3 días", "hace 2 días". */
export function relativeDueLabel(
  dueAt: Date | null,
  timezone: string,
  hasTime = false,
  now: Date = new Date(),
): string {
  if (!dueAt) return "Sin fecha";

  const zoned = new TZDate(dueAt, timezone);
  const due = startOfDay(zoned);
  const today = startOfDay(new TZDate(now, timezone));
  const days = differenceInCalendarDays(due, today);
  const time = hasTime ? ` · ${format(zoned, "h:mm a", { locale: es })}` : "";

  if (days === 0) return `Hoy${time}`;
  if (days === 1) return `Mañana${time}`;
  if (days === -1) return `Ayer${time}`;
  if (days < -1) return `Hace ${Math.abs(days)} días`;
  if (days <= 7) return `En ${days} días${time}`;

  return format(zoned, days > 300 ? "d MMM yyyy" : "d MMM", { locale: es }) + time;
}

/** "miércoles 6 de agosto" */
export function longDate(date: Date, timezone: string): string {
  return format(new TZDate(date, timezone), "EEEE d 'de' MMMM", { locale: es });
}

export function shortDate(date: Date | string, timezone: string): string {
  const d = typeof date === "string" ? new Date(`${date}T12:00:00Z`) : date;
  return format(new TZDate(d, timezone), "d MMM", { locale: es });
}

/**
 * Ordena los días para que la semana empiece donde el usuario quiera.
 * `weekStartsOn` es ISO: 1 = lunes … 7 = domingo.
 */
export function orderedWeekdays(weekStartsOn: number): number[] {
  return Array.from({ length: 7 }, (_, i) => ((weekStartsOn - 1 + i) % 7) + 1);
}
