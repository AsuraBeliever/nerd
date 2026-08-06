"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

/**
 * Acceso local sin Google. Solo se renderiza cuando el servidor lo permite
 * (fuera de producción y con DEV_LOGIN=true).
 */
export function DevLoginButton({ googleAvailable }: { googleAvailable: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function enter() {
    start(async () => {
      const res = await fetch("/api/dev-login", { method: "POST" });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={googleAvailable ? "secondary" : "primary"}
        className="w-full"
        onClick={enter}
        disabled={pending}
      >
        {pending ? "Entrando…" : "Entrar en modo desarrollo"}
      </Button>
      <p className="text-xs text-text-subtle">
        Acceso local mientras se configuran las credenciales de Google. No existe en producción.
      </p>
    </div>
  );
}
