"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startWorkout } from "../actions";

export function StartWorkout({
  routines,
}: {
  routines: { id: string; name: string; exerciseCount: number }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function begin(routineId: string | null) {
    start(async () => {
      const result = await startWorkout(routineId);
      if (result.ok) router.push("/entrenamiento/entrenar");
    });
  }

  return (
    <div className="space-y-3">
      {routines.map((routine) => (
        <button
          key={routine.id}
          type="button"
          onClick={() => begin(routine.id)}
          disabled={pending}
          className="flex w-full items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-left hover:bg-surface-subtle"
        >
          <Play className="size-4 shrink-0 text-text-subtle" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px]">{routine.name}</span>
            <span className="block text-[13px] text-text-subtle">
              {routine.exerciseCount} {routine.exerciseCount === 1 ? "ejercicio" : "ejercicios"}
            </span>
          </span>
        </button>
      ))}

      <Button variant="secondary" className="w-full" disabled={pending} onClick={() => begin(null)}>
        Sesión libre, sin rutina
      </Button>
    </div>
  );
}
