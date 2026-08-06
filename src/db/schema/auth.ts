import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const themeEnum = pgEnum("theme", ["system", "light", "dark"]);
export const weightUnitEnum = pgEnum("weight_unit", ["kg", "lb"]);

/**
 * Tablas de Auth.js (adaptador Drizzle) + las preferencias del usuario.
 *
 * Toda preferencia de aquí existe por la regla del proyecto: si el usuario
 * puede tener una opinión sobre un comportamiento, es un ajuste, no una
 * constante (ADR-012).
 */
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),

  // --- Preferencias generales ---
  timezone: text("timezone").notNull().default("America/Mexico_City"),
  /** 1 = lunes … 7 = domingo (ISO-8601) */
  weekStartsOn: smallint("week_starts_on").notNull().default(1),
  /** Días visibles en el horario. NULL = se deducen de los bloques. */
  visibleWeekdays: smallint("visible_weekdays").array(),
  theme: themeEnum("theme").notNull().default("system"),

  // --- Asistencia ---
  defaultMinAttendancePct: numeric("default_min_attendance_pct", { precision: 5, scale: 2 })
    .notNull()
    .default("80.00"),
  /** El cliente: "las justificaciones sí cuentan como asistencias". */
  excusedCountsAsPresent: boolean("excused_counts_as_present").notNull().default(true),
  /** El cliente: "no existen retardos". Apagado, el botón "Tarde" no aparece. */
  trackLates: boolean("track_lates").notNull().default(false),
  /** Regla "N retardos = 1 falta". Solo aplica con trackLates activo. */
  latesPerAbsence: smallint("lates_per_absence"),

  // --- Académico ---
  /** Módulo de calificaciones dormido hasta que alguien lo encienda (ADR-013). */
  trackGrades: boolean("track_grades").notNull().default(false),

  // --- Entrenamiento ---
  weightUnit: weightUnitEnum("weight_unit").notNull().default("kg"),
  /** El cliente entrena en casa: por defecto solo peso corporal. */
  availableEquipment: text("available_equipment").array(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export type User = typeof users.$inferSelect;
