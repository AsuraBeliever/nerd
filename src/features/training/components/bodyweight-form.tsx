"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { todayIn } from "@/lib/dates";
import { recordBodyweight } from "../actions";
import { parseWeightInput, type WeightUnit } from "../units";

/**
 * Con puro peso corporal, este dato sirve doble: es la carga real de cada
 * lagartija o sentadilla, así que alimenta el cálculo de volumen.
 */
export function BodyweightForm({ unit, timezone }: { unit: WeightUnit; timezone: string }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setSaved(false);
    const kg = parseWeightInput((formData.get("weight") as string) ?? "", unit);
    if (kg === null) {
      setError("Escribe un peso válido");
      return;
    }

    start(async () => {
      const result = await recordBodyweight({
        date: (formData.get("date") as string) || todayIn(timezone),
        weightKg: kg,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <form action={submit} className="flex flex-wrap items-end gap-3">
      <Field label={`Peso (${unit})`} htmlFor="weight" className="w-32">
        <Input id="weight" name="weight" inputMode="decimal" required />
      </Field>
      <Field label="Fecha" htmlFor="date" className="w-44">
        <Input id="date" name="date" type="date" defaultValue={todayIn(timezone)} />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Guardando…" : "Registrar"}
      </Button>
      {saved && <span className="text-[13px] text-success">Guardado</span>}
      {error && <span className="text-[13px] text-danger">{error}</span>}
    </form>
  );
}
