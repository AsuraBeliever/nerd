import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { remainingLabel } from "@/features/attendance/components/attendance-bar";
import { TodaySessions } from "@/features/attendance/components/today-sessions";
import { getDashboard } from "@/features/dashboard/queries";
import { NextClass } from "@/features/schedule/components/next-class";
import { TaskRow } from "@/features/tasks/components/task-row";
import { toListItem } from "@/features/tasks/to-list-item";
import { longDate, minutesOfDayIn, weekdayIn } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboard(user);

  const nowMinutes = minutesOfDayIn(user.timezone);
  const weekday = weekdayIn(user.timezone);

  const nothingAtAll =
    data.schedule.length === 0 && data.dueSoon.length === 0 && data.personalDue.length === 0;

  return (
    <>
      <PageHeader title="Hoy" description={capitalize(longDate(new Date(), user.timezone))} />

      {data.schedule.length > 0 && (
        <div className="mb-8">
          <NextClass blocks={data.schedule} weekday={weekday} minutesNow={nowMinutes} />
        </div>
      )}

      {/* Solo se avisa de faltas cuando hay riesgo real. */}
      {data.atRisk.length > 0 && (
        <ul className="mb-8 space-y-1.5">
          {data.atRisk.map(({ course, summary }) => (
            <li
              key={course.id}
              className="rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-[13px]"
            >
              <Link href={`/materias/${course.id}`} className="hover:underline">
                <span className="font-medium">{course.name}</span>: {remainingLabel(summary)}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {nothingAtAll ? (
        <EmptyState
          title="Todavía no hay nada que mostrar"
          description="Empieza por tu horario: crea tus materias y sus clases. Después vendrán solas las tareas y la asistencia."
          action={
            <Link href="/materias" className={buttonVariants({ variant: "primary" })}>
              Agregar mis materias
            </Link>
          }
        />
      ) : (
        <div className="space-y-10">
          {data.sessions.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Clases de hoy</h2>
              <TodaySessions
                sessions={data.sessions}
                date={data.date}
                nowMinutes={nowMinutes}
                trackLates={user.trackLates}
              />
            </section>
          )}

          {data.dueSoon.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Vence pronto</h2>
                <Link href="/tareas" className="text-[13px] text-text-secondary hover:underline">
                  Ver todas
                </Link>
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
                {data.dueSoon.map((task) => (
                  <TaskRow key={task.id} task={toListItem(task)} timezone={user.timezone} />
                ))}
              </ul>
            </section>
          )}

          {data.personalDue.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Pendientes de hoy</h2>
                <Link
                  href="/pendientes"
                  className="text-[13px] text-text-secondary hover:underline"
                >
                  Ver todos
                </Link>
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
                {data.personalDue.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={toListItem(task)}
                    timezone={user.timezone}
                    showCourse={false}
                  />
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-semibold">Entrenamiento</h2>
            <TrainingLine
              openWorkout={Boolean(data.openWorkout)}
              lastStartedAt={data.lastWorkout?.startedAt ?? null}
            />
          </section>
        </div>
      )}
    </>
  );
}

function TrainingLine({
  openWorkout,
  lastStartedAt,
}: {
  openWorkout: boolean;
  lastStartedAt: Date | null;
}) {
  if (openWorkout) {
    return (
      <Link
        href="/entrenamiento/entrenar"
        className="flex items-center gap-3 rounded-card border border-accent bg-accent/10 px-4 py-3 text-[15px]"
      >
        <Dumbbell className="size-4" aria-hidden="true" />
        Tienes una sesión en curso — continuar
      </Link>
    );
  }

  const days = lastStartedAt
    ? Math.floor((Date.now() - lastStartedAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <Link
      href="/entrenamiento"
      className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-[15px] hover:bg-surface-subtle"
    >
      <Dumbbell className="size-4 text-text-subtle" aria-hidden="true" />
      {days === null
        ? "Todavía no registras entrenamientos"
        : days === 0
          ? "Ya entrenaste hoy"
          : `Último entrenamiento: hace ${days} ${days === 1 ? "día" : "días"}`}
    </Link>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
