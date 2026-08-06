"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { logSet } from "../actions";

/**
 * Agregar un ejercicio a media sesión. La rutina es una guía, no una regla:
 * siempre se puede hacer algo que no estaba planeado.
 */
export function AddExerciseToWorkout({
  workoutId,
  exercises,
}: {
  workoutId: string;
  exercises: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (exercises.length === 0) return null;

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Agregar otro ejercicio
      </Button>
    );
  }

  function add(formData: FormData) {
    const exerciseId = formData.get("exerciseId") as string;
    if (!exerciseId) return;
    start(async () => {
      // Se registra una serie vacía para que la tarjeta aparezca; el usuario
      // la corrige o la borra si se equivocó de ejercicio.
      await logSet({
        workoutId,
        exerciseId,
        reps: 0,
        weightKg: null,
        addedWeightKg: null,
        durationSeconds: null,
        distanceM: null,
        isWarmup: false,
      });
      setOpen(false);
    });
  }

  return (
    <form action={add} className="flex gap-2">
      <Select name="exerciseId" defaultValue="" required aria-label="Ejercicio">
        <option value="" disabled>
          Elige un ejercicio
        </option>
        {exercises.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="primary" disabled={pending}>
        Agregar
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
    </form>
  );
}
