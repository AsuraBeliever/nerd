import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { devLoginEnabled, googleConfigured } from "@/env";
import { signIn } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { DevLoginButton } from "./dev-login-button";

export const metadata = { title: "Entrar · nerd" };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/");

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">nerd</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        Tu horario, tus faltas, tus pendientes y tu entrenamiento en un solo lugar.
      </p>

      <div className="mt-8 space-y-3">
        {googleConfigured && (
          <form action={signInWithGoogle}>
            <Button type="submit" variant="primary" className="w-full">
              Continuar con Google
            </Button>
          </form>
        )}

        {devLoginEnabled && <DevLoginButton googleAvailable={googleConfigured} />}

        {!googleConfigured && !devLoginEnabled && (
          <p className="rounded-card border border-border bg-surface-subtle p-4 text-[13px] text-text-secondary">
            El acceso con Google todavía no está configurado en este entorno.
          </p>
        )}
      </div>
    </main>
  );
}
