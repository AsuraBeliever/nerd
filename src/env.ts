import "server-only";
import { z } from "zod";

/**
 * Variables de entorno validadas al arrancar. Si falta algo, la app falla
 * de inmediato con un mensaje claro, en vez de romperse a media petición.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, "Falta DATABASE_URL"),
  AUTH_SECRET: z.string().min(1, "Falta AUTH_SECRET"),
  AUTH_URL: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  /**
   * Solo desarrollo: permite entrar sin Google mientras el cliente consigue
   * las credenciales de OAuth. Se ignora por completo en producción.
   */
  DEV_LOGIN: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(
    `Variables de entorno inválidas:\n${issues}\n\nRevisa .env.local (ver .env.example).`,
  );
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

/** El acceso sin Google solo existe fuera de producción, y solo si se pide. */
export const devLoginEnabled = !isProduction && env.DEV_LOGIN === "true";

export const googleConfigured = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
