"use client";

import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { TrackingType } from "@/db/schema";
import { deleteSet, logSet } from "../actions";
import { formatWeight, kgToDisplay, parseWeightInput, stepFor, type WeightUnit } from "../units";

export type LoggedSet = {
  id: string;
  reps: number | null;
  weightKg: string | null;
  durationSeconds: number | null;
  isWarmup: boolean;
};

/**
 * Tarjeta de un ejercicio dentro de la sesión.
 *
 * Se usa de pie, con una mano, entre series. Por eso: valores precargados de
 * la última vez, botones grandes, y la serie se ve registrada al instante
 * aunque la red vaya lenta.
 */
export function SetLogger({
  workoutId,
  exerciseId,
  name,
  trackingType,
  unit,
  target,
  lastValues,
  sets,
}: {
  workoutId: string;
  exerciseId: string;
  name: string;
  trackingType: TrackingType;
  unit: WeightUnit;
  target: string | null;
  lastValues: {
    reps: number | null;
    weightKg: string | null;
    durationSeconds: number | null;
  } | null;
  sets: LoggedSet[];
}) {
  const usesWeight = trackingType === "weight_reps";
  const usesTime = trackingType === "time";

  const [reps, setReps] = useState(String(lastValues?.reps ?? 10));
  const [weight, setWeight] = useState(
    lastValues?.weightKg ? String(round(kgToDisplay(Number(lastValues.weightKg), unit))) : "",
  );
  const [seconds, setSeconds] = useState(String(lastValues?.durationSeconds ?? 30));
  const [warmup, setWarmup] = useState(false);
  const [optimisticSets, addOptimistic] = useOptimistic(sets);
  const [, start] = useTransition();

  const step = stepFor(unit);

  function bumpWeight(delta: number) {
    const current = Number(weight.replace(",", ".")) || 0;
    setWeight(String(Math.max(0, round(current + delta))));
  }

  function save() {
    const payload = {
      workoutId,
      exerciseId,
      reps: usesTime ? null : Number(reps) || null,
      weightKg: usesWeight ? parseWeightInput(weight, unit) : null,
      addedWeightKg: null,
      durationSeconds: usesTime ? Number(seconds) || null : null,
      distanceM: null,
      isWarmup: warmup,
    };

    start(async () => {
      addOptimistic([
        ...optimisticSets,
        {
          id: `temp-${Date.now()}`,
          reps: payload.reps,
          weightKg: payload.weightKg?.toString() ?? null,
          durationSeconds: payload.durationSeconds,
          isWarmup: warmup,
        },
      ]);
      await logSet(payload);
    });
  }

  function remove(id: string) {
    start(async () => {
      await deleteSet(id);
    });
  }

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-medium">{name}</h3>
        {target && <span className="shrink-0 text-[13px] text-text-subtle">{target}</span>}
      </div>

      {optimisticSets.length > 0 && (
        <ul className="mb-3 space-y-1">
          {optimisticSets.map((set, index) => (
            <li key={set.id} className="flex items-center gap-2 text-[13px]">
              <span className="w-6 text-text-subtle">{index + 1}</span>
              <span className="flex-1 text-text-secondary">
                {describeSet(set, unit, trackingType)}
                {set.isWarmup && <span className="ml-2 text-text-subtle">calentamiento</span>}
              </span>
              {!set.id.startsWith("temp-") && (
                <button
                  type="button"
                  onClick={() => remove(set.id)}
                  aria-label={`Borrar serie ${index + 1}`}
                  className="text-text-subtle hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        {usesWeight && (
          <div className="flex items-end gap-1">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => bumpWeight(-step)}
              aria-label={`Bajar ${step} ${unit}`}
            >
              <Minus className="size-4" />
            </Button>
            <div className="flex flex-col text-xs text-text-subtle">
              <label htmlFor={`${exerciseId}-weight`}>Peso ({unit})</label>
              <Input
                id={`${exerciseId}-weight`}
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-20 text-center"
              />
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => bumpWeight(step)}
              aria-label={`Subir ${step} ${unit}`}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}

        {usesTime ? (
          <div className="flex flex-col text-xs text-text-subtle">
            <label htmlFor={`${exerciseId}-seconds`}>Segundos</label>
            <Input
              id={`${exerciseId}-seconds`}
              inputMode="numeric"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="w-20 text-center"
            />
          </div>
        ) : (
          <div className="flex flex-col text-xs text-text-subtle">
            <label htmlFor={`${exerciseId}-reps`}>Reps</label>
            <Input
              id={`${exerciseId}-reps`}
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-20 text-center"
            />
          </div>
        )}

        <Button variant="primary" onClick={save} className="flex-1">
          <Check className="size-4" /> Registrar
        </Button>
      </div>

      <label className="mt-3 flex items-center gap-2 text-[13px] text-text-secondary">
        <input
          type="checkbox"
          checked={warmup}
          onChange={(e) => setWarmup(e.target.checked)}
          className="size-4 accent-[var(--accent)]"
        />
        Es calentamiento (no cuenta en las estadísticas)
      </label>
    </section>
  );
}

function describeSet(set: LoggedSet, unit: WeightUnit, trackingType: TrackingType) {
  if (trackingType === "time") return `${set.durationSeconds ?? 0} s`;
  const weight = set.weightKg ? ` × ${formatWeight(Number(set.weightKg), unit)}` : "";
  return `${set.reps ?? 0} reps${weight}`;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
