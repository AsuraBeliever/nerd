import { PageHeader } from "@/components/shared/page-header";
import { TaskList } from "@/features/tasks/components/task-list";
import { listTasks } from "@/features/tasks/queries";
import { toListItem } from "@/features/tasks/to-list-item";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Pendientes · nerd" };

/**
 * Pendientes personales: misma tabla que las tareas, con `courseId = NULL`.
 * Aquí nunca se ve nada de la escuela, y en Tareas nunca se ve nada de aquí.
 */
export default async function TodosPage() {
  const user = await requireUser();
  const tasks = await listTasks(user.id, { scope: "personal" });

  return (
    <>
      <PageHeader
        title="Pendientes"
        description="Lo tuyo, fuera de la escuela. Nada de esto se mezcla con tus tareas."
      />
      <TaskList
        tasks={tasks.map(toListItem)}
        timezone={user.timezone}
        courses={[]}
        personal
        emptyTitle="No tienes pendientes"
        emptyDescription="Trámites, compras, recordatorios: lo que no es de una materia va aquí."
      />
    </>
  );
}
