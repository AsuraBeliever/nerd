import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { listCourses } from "@/features/courses/queries";
import { TaskList } from "@/features/tasks/components/task-list";
import { listTasks } from "@/features/tasks/queries";
import { toListItem } from "@/features/tasks/to-list-item";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Tareas · nerd" };

export default async function TasksPage() {
  const user = await requireUser();
  const [courses, tasks] = await Promise.all([
    listCourses(user.id),
    listTasks(user.id, { scope: "academic" }),
  ]);

  if (courses.length === 0) {
    return (
      <>
        <PageHeader title="Tareas" />
        <EmptyState
          title="Primero necesitas materias"
          description="Las tareas y exámenes se cuelgan de una materia. Los pendientes sin materia van en su propia sección."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/materias" className={buttonVariants({ variant: "primary" })}>
                Agregar materias
              </Link>
              <Link href="/pendientes" className={buttonVariants({ variant: "secondary" })}>
                Ir a pendientes
              </Link>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tareas"
        description="Lo de tus materias. Lo personal vive en Pendientes."
      />
      <TaskList
        tasks={tasks.map(toListItem)}
        timezone={user.timezone}
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        emptyTitle="No tienes tareas pendientes"
        emptyDescription="Cuando te dejen algo, captúralo aquí y no se te va a pasar."
      />
    </>
  );
}
