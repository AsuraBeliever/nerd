import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { env, googleConfigured } from "@/env";

export const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  // Sesiones en base de datos, no solo JWT: permite cerrar sesión de verdad
  // y revocar accesos (docs/08-seguridad.md).
  session: { strategy: "database" },
  pages: { signIn: "/entrar" },
  providers: googleConfigured
    ? [
        Google({
          clientId: env.AUTH_GOOGLE_ID,
          clientSecret: env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : [],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});

/** Nombre real de la cookie de sesión, que cambia entre HTTP y HTTPS. */
export const SESSION_COOKIE = env.AUTH_URL?.startsWith("https")
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
