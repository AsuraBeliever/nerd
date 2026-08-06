"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/field";
import type { Equipment } from "@/db/schema";
import { WEEKDAY_NAMES } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { exportData, updateSettings } from "../actions";

const EQUIPMENT_LABEL: Record<Equipment, string> = {
  bodyweight: "Peso corporal",
  dumbbell: "Mancuernas",
  resistance_band: "Bandas",
  kettlebell: "Kettlebell",
  pullup_bar: "Barra de dominadas",
  barbell: "Barra olímpica",
  machine: "Máquinas",
  cable: "Poleas",
  other: "Otro",
};

export type SettingsValues = {
  timezone: string;
  weekStartsOn: number;
  visibleWeekdays: number[] | null;
  theme: "system" | "light" | "dark";
  defaultMinAttendancePct: string;
  excusedCountsAsPresent: boolean;
  trackLates: boolean;
  latesPerAbsence: number | null;
  trackGrades: boolean;
  weightUnit: "kg" | "lb";
  availableEquipment: string[] | null;
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set<K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  function toggleDay(day: number) {
    const current = values.visibleWeekdays ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    set("visibleWeekdays", next.length === 0 ? null : next.sort((a, b) => a - b));
  }

  function toggleEquipment(item: Equipment) {
    const current = values.availableEquipment ?? [];
    const next = current.includes(item) ? current.filter((e) => e !== item) : [...current, item];
    set("availableEquipment", next.length === 0 ? null : next);
  }

  function save() {
    setError(null);
    start(async () => {
      const result = await updateSettings({
        ...values,
        defaultMinAttendancePct: Number(values.defaultMinAttendancePct),
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  function download() {
    start(async () => {
      const result = await exportData();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const blob = new Blob([result.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nerd-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-10">
      <Section title="General">
        <Field label="Zona horaria" htmlFor="timezone" hint="Se usa para tus fechas y tu 'hoy'.">
          <Input
            id="timezone"
            value={values.timezone}
            onChange={(e) => set("timezone", e.target.value)}
          />
        </Field>

        <Field label="La semana empieza en" htmlFor="weekStartsOn">
          <Select
            id="weekStartsOn"
            value={values.weekStartsOn}
            onChange={(e) => set("weekStartsOn", Number(e.target.value))}
          >
            {WEEKDAY_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </Select>
        </Field>

        <fieldset>
          <legend className="mb-2 block text-[13px] font-medium text-text-secondary">
            Días visibles en el horario
          </legend>
          <p className="mb-2 text-xs text-text-subtle">
            Sin selección, se muestran solo los días en los que tienes clase.
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_NAMES.map((name, i) => {
              const day = i + 1;
              const active = values.visibleWeekdays?.includes(day) ?? false;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={active}
                  className={cn(
                    "h-9 rounded-control border px-3 text-[13px]",
                    active
                      ? "border-accent bg-accent/10 text-text"
                      : "border-border text-text-secondary",
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field label="Tema" htmlFor="theme">
          <Select
            id="theme"
            value={values.theme}
            onChange={(e) => set("theme", e.target.value as SettingsValues["theme"])}
          >
            <option value="system">Seguir al sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </Select>
        </Field>
      </Section>

      <Section title="Asistencia">
        <Field
          label="Asistencia mínima general (%)"
          htmlFor="minAttendance"
          hint="Cada materia puede tener su propio mínimo."
        >
          <Input
            id="minAttendance"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={values.defaultMinAttendancePct}
            onChange={(e) => set("defaultMinAttendancePct", e.target.value)}
          />
        </Field>

        <Toggle
          label="Las faltas justificadas cuentan como asistencia"
          checked={values.excusedCountsAsPresent}
          onChange={(v) => set("excusedCountsAsPresent", v)}
        />

        <Toggle
          label="Registrar retardos"
          hint="Apagado, el botón 'Tarde' ni siquiera aparece."
          checked={values.trackLates}
          onChange={(v) => set("trackLates", v)}
        />

        {values.trackLates && (
          <Field
            label="Retardos que hacen una falta"
            htmlFor="latesPerAbsence"
            hint="Vacío = los retardos no suman faltas."
          >
            <Input
              id="latesPerAbsence"
              type="number"
              min={2}
              max={10}
              value={values.latesPerAbsence ?? ""}
              onChange={(e) =>
                set("latesPerAbsence", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </Field>
        )}
      </Section>

      <Section title="Académico">
        <Toggle
          label="Registrar calificaciones"
          hint="Agrega los campos de calificación a tus tareas y materias."
          checked={values.trackGrades}
          onChange={(v) => set("trackGrades", v)}
        />
      </Section>

      <Section title="Entrenamiento">
        <Field label="Unidad de peso" htmlFor="weightUnit">
          <Select
            id="weightUnit"
            value={values.weightUnit}
            onChange={(e) => set("weightUnit", e.target.value as "kg" | "lb")}
          >
            <option value="kg">Kilogramos</option>
            <option value="lb">Libras</option>
          </Select>
        </Field>

        <fieldset>
          <legend className="mb-2 block text-[13px] font-medium text-text-secondary">
            Equipo disponible
          </legend>
          <p className="mb-2 text-xs text-text-subtle">
            Filtra el catálogo. Sin selección, se muestran todos los ejercicios.
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((item) => {
              const active = values.availableEquipment?.includes(item) ?? false;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleEquipment(item)}
                  aria-pressed={active}
                  className={cn(
                    "h-9 rounded-control border px-3 text-[13px]",
                    active
                      ? "border-accent bg-accent/10 text-text"
                      : "border-border text-text-secondary",
                  )}
                >
                  {EQUIPMENT_LABEL[item]}
                </button>
              );
            })}
          </div>
        </fieldset>
      </Section>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={save} disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
        {saved && <span className="text-[13px] text-success">Guardado</span>}
        {error && <span className="text-[13px] text-danger">{error}</span>}
      </div>

      <Section title="Tus datos">
        <p className="text-[13px] text-text-secondary">
          Todo lo que guardas aquí es tuyo. Puedes llevártelo completo cuando quieras.
        </p>
        <Button variant="secondary" onClick={download} disabled={pending}>
          Exportar todo a JSON
        </Button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 accent-[var(--accent)]"
      />
      <div>
        <Label htmlFor={id} className="text-[15px] text-text">
          {label}
        </Label>
        {hint && <p className="text-xs text-text-subtle">{hint}</p>}
      </div>
    </div>
  );
}
