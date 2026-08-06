import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

/**
 * En desarrollo el módulo se recarga en caliente muchas veces; sin este
 * caché global se abrirían conexiones nuevas hasta agotar el pool.
 */
const globalForDb = globalThis as unknown as { conn?: postgres.Sql };

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL, { max: 10 });

if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });

export { schema };
