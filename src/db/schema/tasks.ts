import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { courses } from "./academic";
import { users } from "./auth";

export const taskTypeEnum = pgEnum("task_type", [
  "homework",
  "exam",
  "project",
  "reading",
  "personal",
  "other",
]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "doing", "done"]);

/**
 * Una sola tabla para tareas académicas Y pendientes personales (ADR-004).
 * `courseId = NULL` significa pendiente personal. La separación es de
 * interfaz: en la app son dos secciones, aquí abajo son el mismo objeto.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    notes: text("notes"),
    type: taskTypeEnum("type").notNull().default("homework"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    /** false = se muestra solo la fecha, sin hora. */
    hasTime: boolean("has_time").notNull().default(false),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    status: taskStatusEnum("status").notNull().default("todo"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),

    // --- Calificaciones: dormidas (ADR-013) ---
    grade: numeric("grade", { precision: 5, scale: 2 }),
    gradeWeightPct: numeric("grade_weight_pct", { precision: 5, scale: 2 }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasks_user_status_due_idx").on(t.userId, t.status, t.dueAt),
    index("tasks_user_course_idx").on(t.userId, t.courseId),
  ],
);

export const subtasks = pgTable(
  "subtasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: boolean("done").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("subtasks_task_idx").on(t.taskId)],
);

export type Task = typeof tasks.$inferSelect;
export type Subtask = typeof subtasks.$inferSelect;
export type TaskType = (typeof taskTypeEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
