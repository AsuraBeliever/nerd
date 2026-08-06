import { z } from "zod";

export const taskSchema = z.object({
  /** NULL = pendiente personal. Es la única diferencia entre los dos módulos. */
  courseId: z.uuid().nullable().catch(null),
  title: z.string().trim().min(1, "La tarea necesita un título").max(200),
  notes: z.string().trim().max(5000).nullable().catch(null),
  type: z.enum(["homework", "exam", "project", "reading", "personal", "other"]),
  /** ISO completo si tiene hora, o YYYY-MM-DD si no. */
  dueAt: z.string().nullable().catch(null),
  hasTime: z.boolean(),
  priority: z.enum(["low", "medium", "high"]),
});

export const subtaskSchema = z.object({
  taskId: z.uuid(),
  title: z.string().trim().min(1, "Escribe el paso").max(200),
});

export type TaskInput = z.infer<typeof taskSchema>;
