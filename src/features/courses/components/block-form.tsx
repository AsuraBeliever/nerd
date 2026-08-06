"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { WEEKDAY_NAMES } from "@/lib/dates";
import { createBlock, updateBlock } from "../actions";

export type BlockFormValues = {
  id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string | null;
};

export function BlockForm({
  open,
  onClose,
  courseId,
  initial,
  onWarning,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  initial?: BlockFormValues;
  onWarning?: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    const input = {
      courseId,
      weekday: formData.get("weekday"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      room: (formData.get("room") as string)?.trim() || null,
    };

    start(async () => {
      const result = initial?.id ? await updateBlock(initial.id, input) : await createBlock(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.warning) onWarning?.(result.warning);
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? "Editar clase" : "Agregar clase"}>
      <form action={submit} className="space-y-4">
        <Field label="Día" htmlFor="weekday">
          <Select id="weekday" name="weekday" defaultValue={initial?.weekday ?? 1} required>
            {WEEKDAY_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Empieza" htmlFor="startTime">
            <Input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue={(initial?.startTime ?? "07:00").slice(0, 5)}
            />
          </Field>
          <Field label="Termina" htmlFor="endTime">
            <Input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue={(initial?.endTime ?? "09:00").slice(0, 5)}
            />
          </Field>
        </div>

        <Field label="Salón" htmlFor="blockRoom" hint="Solo si es distinto al de la materia.">
          <Input id="blockRoom" name="room" maxLength={60} defaultValue={initial?.room ?? ""} />
        </Field>

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
