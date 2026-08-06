import { date, index, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { courseBlocks, courses } from "./academic";
import { users } from "./auth";

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "excused",
  "cancelled",
]);

/**
 * Un registro por sesión de clase, no por día.
 *
 * No existe el estado "sin registrar": simplemente no hay fila. Asumir falta
 * cuando el usuario olvidó marcar arruinaría sus números y sería injusto.
 */
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    /** NULL para materias sin horario fijo (en línea, asesorías). */
    blockId: uuid("block_id").references(() => courseBlocks.id, { onDelete: "set null" }),
    date: date("date").notNull(),
    status: attendanceStatusEnum("status").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("attendance_user_course_date_idx").on(t.userId, t.courseId, t.date),
    unique("attendance_unique_session").on(t.courseId, t.date, t.blockId),
  ],
);

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type AttendanceStatus = (typeof attendanceStatusEnum.enumValues)[number];
