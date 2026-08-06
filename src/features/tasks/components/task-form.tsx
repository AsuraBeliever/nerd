"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { TaskType } from "@/db/schema";
import { createTask, deleteTask, updateTask } from "../actions";
import { PRIORITY_LABEL, TASK_TYPE_LABEL } from "../lib";

export type TaskFormValues = {
  id?: string;
  courseId: string | null;
  title: string;
  notes: string | null;
  type: TaskType;
  dueDate: string | null;
  dueTime: string | null;
  priority: "low" | "medium" | "high";
};

const ACADEMIC_TYPES: TaskType[] = ["homework", "exam", "project", "reading", "other"];

export function TaskForm({
  open,
  onClose,
  initial,
  courses,
  /** Los pendientes personales no piden materia ni tipo académico. */
  personal = false,
}: {
  open: boolean;
  onClose: () => void;
  initial?: TaskFormValues;
  courses: { id: string; name: string }[];
  personal?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    const date = (formData.get("dueDate") as string) || null;
    const time = (formData.get("dueTime") as string) || null;
    const hasTime = Boolean(date && time);

    const input = {
      courseId: personal ? null : (formData.get("courseId") as string) || null,
      title: formData.get("title"),
      notes: ((formData.get("notes") as string) || "").trim() || null,
      type: personal ? "personal" : formData.get("type"),
      dueAt: date ? (hasTime ? `${date}T${time}` : date) : null,
      hasTime,
      priority: formData.get("priority"),
    };

    start(async () => {
      const result = initial?.id ? await updateTask(initial.id, input) : await createTask(input);
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  function remove() {
    if (!initial?.id) return;
    start(async () => {
      await deleteTask(initial.id as string);
      onClose();
    });
  }

  const title = initial?.id
    ? personal
      ? "Editar pendiente"
      : "Editar tarea"
    : personal
      ? "Nuevo pendiente"
      : "Nueva tarea";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form action={submit} className="space-y-4">
        <Field label="Título" htmlFor="title">
          <Input
            id="title"
            name="title"
            required
            maxLength={200}
            defaultValue={initial?.title ?? ""}
          />
        </Field>

        {!personal && (
          <>
            <Field label="Materia" htmlFor="courseId">
              <Select id="courseId" name="courseId" defaultValue={initial?.courseId ?? ""} required>
                <option value="" disabled>
                  Elige una materia
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tipo" htmlFor="type">
              <Select id="type" name="type" defaultValue={initial?.type ?? "homework"}>
                {ACADEMIC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TASK_TYPE_LABEL[type]}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha" htmlFor="dueDate" hint="Opcional">
            <Input id="dueDate" name="dueDate" type="date" defaultValue={initial?.dueDate ?? ""} />
          </Field>
          <Field label="Hora" htmlFor="dueTime" hint="Opcional">
            <Input id="dueTime" name="dueTime" type="time" defaultValue={initial?.dueTime ?? ""} />
          </Field>
        </div>

        <Field label="Prioridad" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue={initial?.priority ?? "medium"}>
            {(["low", "medium", "high"] as const).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notas" htmlFor="notes" hint="Opcional">
          <Textarea id="notes" name="notes" maxLength={5000} defaultValue={initial?.notes ?? ""} />
        </Field>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex items-center justify-between gap-2 pt-2">
          {initial?.id ? (
            <Button type="button" variant="danger" size="sm" onClick={remove} disabled={pending}>
              Eliminar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
