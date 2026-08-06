"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { addRoutineExercise, removeRoutineExercise } from "../actions";
import { formatWeight, parseWeightInput, type WeightUnit } from "../units";

export type RoutineItem = {
  id: string;
  exerciseName: string;
  usesWeight: boolean;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  targetWeightKg: string | null;
  restSeconds: number | null;
};

export function RoutineEditor({
  routineId,
  items,
  exercises,
  unit,
}: {
  routineId: string;
  items: RoutineItem[];
  exercises: { id: string; name: string }[];
  unit: WeightUnit;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add(formData: FormData) {
    setError(null);
    const weight = (formData.get("targetWeight") as string) || "";
    const input = {
      routineId,
      exerciseId: formData.get("exerciseId"),
      targetSets: formData.get("targetSets"),
      targetRepsMin: (formData.get("targetRepsMin") as string) || null,
      targetRepsMax: (formData.get("targetRepsMax") as string) || null,
      targetWeightKg: weight ? parseWeightInput(weight, unit) : null,
      restSeconds: (formData.get("restSeconds") as string) || null,
    };

    start(async () => {
      const result = await addRoutineExercise(input);
      if (result.ok) setAdding(false);
      else setError(result.error);
    });
  }

  function remove(id: string) {
    start(async () => {
      await removeRoutineExercise(id);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Agregar ejercicio
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Esta rutina está vacía"
          description="Agrégale ejercicios con sus series y repeticiones objetivo."
          action={
            <Button variant="primary" onClick={() => setAdding(true)}>
              Agregar ejercicio
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{item.exerciseName}</p>
                <p className="text-[13px] text-text-secondary">{describeTarget(item, unit)}</p>
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                aria-label={`Quitar ${item.exerciseName}`}
                disabled={pending}
                onClick={() => remove(item.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Agregar ejercicio">
        <form action={add} className="space-y-4">
          <Field label="Ejercicio" htmlFor="exerciseId">
            <Select id="exerciseId" name="exerciseId" required defaultValue="">
              <option value="" disabled>
                Elige un ejercicio
              </option>
              {exercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Series" htmlFor="targetSets">
              <Input
                id="targetSets"
                name="targetSets"
                type="number"
                min={1}
                max={20}
                defaultValue={3}
              />
            </Field>
            <Field label="Reps mín." htmlFor="targetRepsMin">
              <Input
                id="targetRepsMin"
                name="targetRepsMin"
                type="number"
                min={1}
                max={200}
                defaultValue={8}
              />
            </Field>
            <Field label="Reps máx." htmlFor="targetRepsMax">
              <Input
                id="targetRepsMax"
                name="targetRepsMax"
                type="number"
                min={1}
                max={200}
                defaultValue={12}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Peso (${unit})`} htmlFor="targetWeight" hint="Opcional">
              <Input id="targetWeight" name="targetWeight" inputMode="decimal" />
            </Field>
            <Field label="Descanso (s)" htmlFor="restSeconds" hint="Opcional">
              <Input
                id="restSeconds"
                name="restSeconds"
                type="number"
                min={0}
                max={900}
                defaultValue={90}
              />
            </Field>
          </div>

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              Agregar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function describeTarget(item: RoutineItem, unit: WeightUnit): string {
  const reps =
    item.targetRepsMin && item.targetRepsMax
      ? item.targetRepsMin === item.targetRepsMax
        ? `${item.targetRepsMin}`
        : `${item.targetRepsMin}-${item.targetRepsMax}`
      : "—";

  const weight =
    item.usesWeight && item.targetWeightKg
      ? ` · ${formatWeight(Number(item.targetWeightKg), unit)}`
      : "";

  const rest = item.restSeconds ? ` · ${item.restSeconds}s descanso` : "";

  return `${item.targetSets} × ${reps}${weight}${rest}`;
}
