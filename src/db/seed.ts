import { isNull } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { SEED_EXERCISES } from "./seed-exercises";
import * as schema from "./schema";

/**
 * Carga el catálogo de ejercicios del sistema (userId NULL).
 * Es idempotente: correrlo dos veces no duplica nada.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql, { schema });

  const existing = await db
    .select({ name: schema.exercises.name })
    .from(schema.exercises)
    .where(isNull(schema.exercises.userId));

  const known = new Set(existing.map((e) => e.name));
  const missing = SEED_EXERCISES.filter((e) => !known.has(e.name));

  if (missing.length > 0) {
    await db.insert(schema.exercises).values(
      missing.map((e) => ({
        userId: null,
        name: e.name,
        muscleGroup: e.muscleGroup,
        equipment: e.equipment,
        trackingType: e.trackingType,
        allowsAddedWeight: e.allowsAddedWeight ?? false,
      })),
    );
  }

  const bodyweight = SEED_EXERCISES.filter(
    (e) => e.equipment === "bodyweight" || e.equipment === "pullup_bar",
  ).length;

  console.log(
    `Catálogo listo: ${missing.length} ejercicios nuevos, ${known.size + missing.length} en total ` +
      `(${bodyweight} sin equipo).`,
  );

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
