"use client";

import { useOptimistic, useTransition } from "react";
import type { TaskType } from "@/db/schema";
import { courseColor } from "@/lib/course-colors";
import { relativeDueLabel, urgencyOf } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { setTaskDone } from "../actions";
import { TASK_TYPE_LABEL, URGENCY_TEXT } from "../lib";

export type TaskRowData = {
  id: string;
  title: string;
  type: TaskType;
  dueAt: string | null;
  hasTime: boolean;
  priority: "low" | "medium" | "high";
  done: boolean;
  courseName: string | null;
  courseColor: string | null;
};

export function TaskRow({
  task,
  timezone,
  onOpen,
  showCourse = true,
}: {
  task: TaskRowData;
  timezone: string;
  onOpen?: (id: string) => void;
  showCourse?: boolean;
}) {
  const [done, setDone] = useOptimistic(task.done);
  const [, start] = useTransition();

  const dueAt = task.dueAt ? new Date(task.dueAt) : null;
  const urgency = urgencyOf(dueAt, timezone);

  function toggle() {
    start(async () => {
      setDone(!done);
      await setTaskDone(task.id, !done);
    });
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={done}
        onChange={toggle}
        aria-label={done ? `Marcar "${task.title}" como pendiente` : `Completar "${task.title}"`}
        className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
      />

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen?.(task.id)}
          className={cn(
            "block w-full truncate text-left text-[15px]",
            done && "text-text-subtle line-through",
            onOpen && "hover:underline",
          )}
        >
          {task.title}
        </button>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
          {showCourse && task.courseName && (
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span
                className={cn("size-2 rounded-full", courseColor(task.courseColor ?? "blue").dot)}
                aria-hidden="true"
              />
              {task.courseName}
            </span>
          )}
          {task.type !== "personal" && task.type !== "other" && (
            <span
              className={cn(
                "text-text-subtle",
                task.type === "exam" && "font-medium text-text-secondary",
              )}
            >
              {TASK_TYPE_LABEL[task.type]}
            </span>
          )}
          {!done && (
            <span className={URGENCY_TEXT[urgency]}>
              {relativeDueLabel(dueAt, timezone, task.hasTime)}
            </span>
          )}
          {task.priority === "high" && !done && (
            <span className="text-text-subtle">· Prioridad alta</span>
          )}
        </div>
      </div>
    </li>
  );
}
