"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { courseColor, suggestColor } from "@/lib/course-colors";
import { cn } from "@/lib/utils";
import { CourseForm, type CourseFormValues } from "./course-form";

export type CourseRow = CourseFormValues & {
  id: string;
  blockCount: number;
  pendingTasks: number;
};

export function CourseList({
  courses,
  defaultMinAttendance,
}: {
  courses: CourseRow[];
  defaultMinAttendance: string;
}) {
  const [editing, setEditing] = useState<CourseFormValues | null>(null);
  const [creating, setCreating] = useState(false);

  const used = courses.map((c) => c.color);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Nueva materia
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="Todavía no tienes materias"
          description="Agrega tu primera materia y después ponle sus horas de clase."
          action={
            <Button variant="primary" onClick={() => setCreating(true)}>
              Agregar materia
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {courses.map((course) => (
            <li key={course.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn("size-2.5 shrink-0 rounded-full", courseColor(course.color).dot)}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/materias/${course.id}`}
                  className="block truncate text-[15px] hover:underline"
                >
                  {course.name}
                </Link>
                <p className="truncate text-[13px] text-text-subtle">
                  {course.blockCount === 0
                    ? "Sin horario"
                    : `${course.blockCount} ${course.blockCount === 1 ? "clase" : "clases"} por semana`}
                  {course.teacher && ` · ${course.teacher}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditing(course)}>
                Editar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <CourseForm
          open
          onClose={() => setCreating(false)}
          suggestedColor={suggestColor(used)}
          defaultMinAttendance={defaultMinAttendance}
        />
      )}
      {editing && (
        <CourseForm
          open
          onClose={() => setEditing(null)}
          initial={editing}
          suggestedColor={editing.color}
          defaultMinAttendance={defaultMinAttendance}
        />
      )}
    </>
  );
}
