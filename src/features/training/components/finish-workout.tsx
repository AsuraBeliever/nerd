"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { finishWorkout } from "../actions";

export function FinishWorkout({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="primary"
      className="w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await finishWorkout(workoutId);
          if (result.ok) router.push("/entrenamiento");
        })
      }
    >
      {pending ? "Terminando…" : "Terminar entrenamiento"}
    </Button>
  );
}
