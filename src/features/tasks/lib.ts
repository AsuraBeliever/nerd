import type { TaskPriority, TaskType } from "@/db/schema";
import { type Urgency, urgencyOf } from "@/lib/dates";

export type TaskLike = {
  id: string;
  title: string;
  dueAt: Date | null;
  hasTime: boolean;
  priority: TaskPriority;
  status: "todo" | "doing" | "done";
  sortOrder: number;
  createdAt: Date;
};

export const URGENCY_ORDER: Urgency[] = [
  "overdue",
  "today",
  "tomorrow",
  "this-week",
  "later",
  "no-date",
];

export const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: "Vencidas",
  today: "Hoy",
  tomorrow: "Mañana",
  "this-week": "Esta semana",
  later: "Después",
  "no-date": "Sin fecha",
};

/** Clases de color por urgencia. Es uno de los dos únicos usos de color semántico. */
export const URGENCY_TEXT: Record<Urgency, string> = {
  overdue: "text-danger",
  today: "text-warning",
  tomorrow: "text-text-secondary",
  "this-week": "text-text-secondary",
  later: "text-text-subtle",
  "no-date": "text-text-subtle",
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/**
 * Orden dentro de un grupo: primero prioridad, luego la hora de entrega,
 * luego el orden manual y por último cuándo se creó.
 */
export function compareTasks(a: TaskLike, b: TaskLike): number {
  const byPriority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  if (byPriority !== 0) return byPriority;

  if (a.dueAt && b.dueAt) {
    const byDue = a.dueAt.getTime() - b.dueAt.getTime();
    if (byDue !== 0) return byDue;
  }

  const bySort = a.sortOrder - b.sortOrder;
  if (bySort !== 0) return bySort;

  return a.createdAt.getTime() - b.createdAt.getTime();
}

export type TaskGroup<T extends TaskLike> = { urgency: Urgency; label: string; tasks: T[] };

/**
 * Agrupa por urgencia en el orden en que le sirven al usuario: lo vencido
 * hasta arriba, siempre.
 */
export function groupByUrgency<T extends TaskLike>(
  tasks: T[],
  timezone: string,
  now: Date = new Date(),
): TaskGroup<T>[] {
  const buckets = new Map<Urgency, T[]>();

  for (const task of tasks) {
    // Una tarea sin fecha nunca se marca vencida.
    const urgency = urgencyOf(task.dueAt, timezone, now);
    const bucket = buckets.get(urgency) ?? [];
    bucket.push(task);
    buckets.set(urgency, bucket);
  }

  return URGENCY_ORDER.filter((u) => (buckets.get(u)?.length ?? 0) > 0).map((urgency) => ({
    urgency,
    label: URGENCY_LABEL[urgency],
    tasks: (buckets.get(urgency) ?? []).sort(compareTasks),
  }));
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  homework: "Tarea",
  exam: "Examen",
  project: "Proyecto",
  reading: "Lectura",
  personal: "Personal",
  other: "Otro",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

/** Progreso de las subtareas, para la barra del detalle. */
export function subtaskProgress(subtasks: { done: boolean }[]): {
  done: number;
  total: number;
  pct: number;
} {
  const total = subtasks.length;
  const done = subtasks.filter((s) => s.done).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/**
 * Nuevo `sortOrder` al mover un elemento. Se recalcula toda la lista para
 * que no queden huecos ni empates.
 */
export function reorder<T extends { id: string }>(
  items: T[],
  fromId: string,
  toIndex: number,
): T[] {
  const from = items.findIndex((i) => i.id === fromId);
  if (from === -1) return items;

  const clamped = Math.max(0, Math.min(toIndex, items.length - 1));
  const copy = [...items];
  const [moved] = copy.splice(from, 1);
  if (!moved) return items;
  copy.splice(clamped, 0, moved);
  return copy;
}
