"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-xl font-semibold">Algo se rompió</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        No fue culpa tuya. Puedes intentar de nuevo; tus datos están a salvo.
      </p>
      <div className="mt-6">
        <Button variant="primary" onClick={reset}>
          Intentar de nuevo
        </Button>
      </div>
    </main>
  );
}
