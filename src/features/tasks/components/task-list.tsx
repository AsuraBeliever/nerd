"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { utcToZonedInput } from "@/lib/dates";
import { groupByUrgency } from "../lib";
import { TaskForm, type TaskFormValues } from "./task-form";
import { TaskRow, type TaskRowData } from "./task-row";

export type TaskListItem = TaskRowData & {
  courseId: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
};

/**
 * Lista agrupada por urgencia. Sirve igual para tareas de materia y para
 * pendientes personales: la única diferencia es `personal`, que quita la
 * materia del formulario y del renglón (ADR-004).
 */
export function TaskList({
  tasks,
  timezone,
  courses,
  personal = false,
  emptyTitle,
  emptyDescription,
}: {
  tasks: TaskListItem[];
  timezone: string;
  courses: { id: string; name: string }[];
  personal?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState("");

  const filtered = useMemo(
    () => (courseFilter ? tasks.filter((t) => t.courseId === courseFilter) : tasks),
    [tasks, courseFilter],
  );

  const groups = useMemo(
    () =>
      groupByUrgency(
        filtered.map((t) => ({
          ...t,
          dueAt: t.dueAt ? new Date(t.dueAt) : null,
          status: t.done ? ("done" as const) : ("todo" as const),
          createdAt: new Date(t.createdAt),
        })),
        timezone,
      ),
    [filtered, timezone],
  );

  const editing = tasks.find((t) => t.id === editingId);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {!personal && courses.length > 0 ? (
          <Select
            aria-label="Filtrar por materia"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="h-9 w-auto text-[13px]"
          >
            <option value="">Todas las materias</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        ) : (
          <span />
        )}

        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> {personal ? "Nuevo pendiente" : "Nueva tarea"}
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button variant="primary" onClick={() => setCreating(true)}>
              {personal ? "Agregar pendiente" : "Agregar tarea"}
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.urgency}>
              <h2 className="mb-2 text-[13px] font-medium text-text-subtle">{group.label}</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
                {group.tasks.map((task) => {
                  const original = filtered.find((t) => t.id === task.id);
                  if (!original) return null;
                  return (
                    <TaskRow
                      key={task.id}
                      task={original}
                      timezone={timezone}
                      onOpen={setEditingId}
                      showCourse={!personal}
                    />
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {creating && (
        <TaskForm open onClose={() => setCreating(false)} courses={courses} personal={personal} />
      )}
      {editing && (
        <TaskForm
          open
          onClose={() => setEditingId(null)}
          courses={courses}
          personal={personal}
          initial={toFormValues(editing, timezone)}
        />
      )}
    </>
  );
}

/**
 * El instante guardado en UTC se parte en la fecha y la hora **que el
 * usuario ve**. Usar `toISOString` aquí mostraría la fecha en UTC y podría
 * correr la entrega un día al editarla.
 */
function toFormValues(task: TaskListItem, timezone: string): TaskFormValues {
  const { date, time } = utcToZonedInput(task.dueAt ? new Date(task.dueAt) : null, timezone);
  return {
    id: task.id,
    courseId: task.courseId,
    title: task.title,
    notes: task.notes,
    type: task.type,
    dueDate: date,
    dueTime: task.hasTime ? time : null,
    priority: task.priority,
  };
}
