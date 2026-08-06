"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { COURSE_COLORS, courseColor } from "@/lib/course-colors";
import { cn } from "@/lib/utils";
import { createCourse, updateCourse } from "../actions";

export type CourseFormValues = {
  id?: string;
  name: string;
  code: string | null;
  teacher: string | null;
  room: string | null;
  color: string;
  credits: number | null;
  minAttendancePct: string | null;
};

export function CourseForm({
  open,
  onClose,
  initial,
  suggestedColor,
  defaultMinAttendance,
}: {
  open: boolean;
  onClose: () => void;
  initial?: CourseFormValues;
  suggestedColor: string;
  defaultMinAttendance: string;
}) {
  const [color, setColor] = useState(initial?.color ?? suggestedColor);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    const input = {
      name: formData.get("name"),
      code: emptyToNull(formData.get("code")),
      teacher: emptyToNull(formData.get("teacher")),
      room: emptyToNull(formData.get("room")),
      color,
      credits: emptyToNull(formData.get("credits")),
      minAttendancePct: emptyToNull(formData.get("minAttendancePct")),
      expectedSessionsOverride: null,
    };

    start(async () => {
      const result = initial?.id
        ? await updateCourse(initial.id, input)
        : await createCourse(input);
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? "Editar materia" : "Nueva materia"}>
      <form action={submit} className="space-y-4">
        <Field label="Nombre" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            defaultValue={initial?.name ?? ""}
            placeholder="Cálculo Diferencial"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Clave" htmlFor="code">
            <Input id="code" name="code" maxLength={40} defaultValue={initial?.code ?? ""} />
          </Field>
          <Field label="Créditos" htmlFor="credits">
            <Input
              id="credits"
              name="credits"
              type="number"
              min={0}
              max={40}
              defaultValue={initial?.credits ?? ""}
            />
          </Field>
        </div>

        <Field label="Profesor" htmlFor="teacher">
          <Input
            id="teacher"
            name="teacher"
            maxLength={120}
            defaultValue={initial?.teacher ?? ""}
          />
        </Field>

        <Field label="Salón" htmlFor="room" hint="Se puede cambiar por bloque de clase.">
          <Input id="room" name="room" maxLength={60} defaultValue={initial?.room ?? ""} />
        </Field>

        <Field
          label="Asistencia mínima (%)"
          htmlFor="minAttendancePct"
          hint={`Vacío = usar tu mínimo general (${defaultMinAttendance}%).`}
        >
          <Input
            id="minAttendancePct"
            name="minAttendancePct"
            type="number"
            min={0}
            max={100}
            step="0.1"
            defaultValue={initial?.minAttendancePct ?? ""}
            placeholder={defaultMinAttendance}
          />
        </Field>

        <fieldset>
          <legend className="mb-2 block text-[13px] font-medium text-text-secondary">Color</legend>
          <div className="flex flex-wrap gap-2">
            {COURSE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                className={cn(
                  "size-8 rounded-full border-2 transition-transform",
                  courseColor(c).dot,
                  color === c ? "scale-110 border-text" : "border-transparent",
                )}
              />
            ))}
          </div>
        </fieldset>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function emptyToNull(value: FormDataEntryValue | null) {
  const str = typeof value === "string" ? value.trim() : "";
  return str === "" ? null : str;
}
