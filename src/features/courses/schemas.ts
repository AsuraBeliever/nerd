import { z } from "zod";
import { COURSE_COLORS } from "@/lib/course-colors";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const termSchema = z.object({
  name: z.string().trim().min(1, "Ponle nombre al semestre").max(60),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .nullable()
    .catch(null),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .nullable()
    .catch(null),
});

export const courseSchema = z.object({
  name: z.string().trim().min(1, "La materia necesita un nombre").max(120),
  code: z.string().trim().max(40).nullable().catch(null),
  teacher: z.string().trim().max(120).nullable().catch(null),
  room: z.string().trim().max(60).nullable().catch(null),
  color: z.enum(COURSE_COLORS),
  credits: z.coerce.number().int().min(0).max(40).nullable().catch(null),
  /** NULL = hereda el mínimo global del usuario. */
  minAttendancePct: z.coerce.number().min(0).max(100).nullable().catch(null),
  expectedSessionsOverride: z.coerce.number().int().min(1).max(400).nullable().catch(null),
});

export const blockSchema = z
  .object({
    courseId: z.uuid("Materia inválida"),
    weekday: z.coerce.number().int().min(1, "Día inválido").max(7, "Día inválido"),
    startTime: z.string().regex(TIME, "Hora inválida"),
    endTime: z.string().regex(TIME, "Hora inválida"),
    room: z.string().trim().max(60).nullable().catch(null),
  })
  .refine((b) => b.endTime > b.startTime, {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["endTime"],
  });

export type TermInput = z.infer<typeof termSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type BlockInput = z.infer<typeof blockSchema>;
