import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  numeric,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/** Semestres / cuatrimestres. Sin periodos, el horario viejo contamina el nuevo. */
export const terms = pgTable(
  "terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("terms_user_idx").on(t.userId)],
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    teacher: text("teacher"),
    room: text("room"),
    /** Token de la paleta ("emerald"), no un hex: se adapta a claro/oscuro. */
    color: text("color").notNull().default("blue"),
    credits: smallint("credits"),

    /** NULL = usar el mínimo global del usuario. */
    minAttendancePct: numeric("min_attendance_pct", { precision: 5, scale: 2 }),
    /** Total de clases del semestre si no se quiere estimar desde el horario. */
    expectedSessionsOverride: smallint("expected_sessions_override"),

    // --- Calificaciones: dormidas hasta que se activen (ADR-013) ---
    passingGrade: numeric("passing_grade", { precision: 5, scale: 2 }),
    gradeScale: numeric("grade_scale", { precision: 5, scale: 2 }),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("courses_user_term_idx").on(t.userId, t.termId)],
);

/**
 * Un bloque = una sesión semanal de clase. `time` sin zona horaria porque
 * "los lunes a las 7:00" es una hora local recurrente, no un instante (ADR-005).
 */
export const courseBlocks = pgTable(
  "course_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 1 = lunes … 7 = domingo. Los 7 días valen igual (ADR-012). */
    weekday: smallint("weekday").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    room: text("room"),
  },
  (t) => [
    index("course_blocks_user_day_idx").on(t.userId, t.weekday, t.startTime),
    check("course_blocks_weekday_range", sql`${t.weekday} between 1 and 7`),
    check("course_blocks_time_order", sql`${t.endTime} > ${t.startTime}`),
  ],
);

export type Term = typeof terms.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseBlock = typeof courseBlocks.$inferSelect;
