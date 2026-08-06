import type { TaskListItem } from "./components/task-list";
import type { TaskWithCourse } from "./queries";

/**
 * Las fechas viajan como texto al cliente: los Server Components no pueden
 * mandar objetos `Date` a través de la frontera sin serializarlos.
 */
export function toListItem(task: TaskWithCourse): TaskListItem {
  return {
    id: task.id,
    title: task.title,
    type: task.type,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    hasTime: task.hasTime,
    priority: task.priority,
    done: task.status === "done",
    courseId: task.courseId,
    courseName: task.course?.name ?? null,
    courseColor: task.course?.color ?? null,
    notes: task.notes,
    sortOrder: task.sortOrder,
    createdAt: task.createdAt.toISOString(),
  };
}
