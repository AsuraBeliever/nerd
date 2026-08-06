import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { type User, users } from "@/db/schema";
import { auth } from "./auth";

/**
 * El usuario de la sesión, con todas sus preferencias.
 *
 * Es la puerta de entrada obligatoria de toda query y toda Server Action.
 * Nada lee la base de datos sin pasar por aquí primero.
 *
 * `cache` evita repetir la consulta cuando varios componentes de la misma
 * página piden el usuario.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
});

/** Igual que `getCurrentUser`, pero manda al login si no hay sesión. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

/**
 * Para Server Actions: no redirige, lanza. Una acción invocada por POST
 * directo sin sesión debe fallar, no responder con una redirección.
 */
export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  return user.id;
}
