import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { devLoginEnabled, isProduction } from "@/env";
import { adapter, SESSION_COOKIE } from "@/lib/auth";

const DEV_EMAIL = "dev@nerd.local";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Acceso local sin Google, para poder construir y probar la app mientras el
 * cliente consigue las credenciales de OAuth.
 *
 * SEGURIDAD: existe solo si NODE_ENV no es production Y DEV_LOGIN=true.
 * En producción esta ruta responde 404 y ni siquiera consulta la base.
 * Crea una sesión real en la tabla `sessions`, igual que Google: el resto de
 * la app no distingue, así que nada queda sin probar.
 */
export async function POST() {
  if (isProduction || !devLoginEnabled) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  let [user] = await db.select().from(users).where(eq(users.email, DEV_EMAIL)).limit(1);

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: DEV_EMAIL,
        name: "Usuario de desarrollo",
        availableEquipment: ["bodyweight"],
      })
      .returning();
  }

  if (!user) return new NextResponse("No se pudo crear el usuario", { status: 500 });

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + THIRTY_DAYS_MS);

  await adapter.createSession?.({ sessionToken, userId: user.id, expires });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    expires,
  });

  return NextResponse.json({ ok: true });
}
