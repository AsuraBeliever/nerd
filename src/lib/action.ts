import type { z } from "zod";

/**
 * Las Server Actions nunca lanzan hacia la interfaz: devuelven un resultado
 * que la pantalla puede mostrar en español.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; warning?: string }
  | { ok: false; error: string };

export function ok<T>(data: T, warning?: string): ActionResult<T> {
  return warning ? { ok: true, data, warning } : { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/** Convierte los errores de Zod en un mensaje legible para el usuario. */
export function parseOrFail<S extends z.ZodType>(
  schema: S,
  input: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; error: string } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const first = result.error.issues[0];
  return { ok: false, error: first?.message ?? "Datos inválidos" };
}
