import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { AttendanceBar } from "@/features/attendance/components/attendance-bar";
import { TodaySessions } from "@/features/attendance/components/today-sessions";
import { getAttendanceByCourse, getSessionsForDate } from "@/features/attendance/queries";
import { courseColor } from "@/lib/course-colors";
import { minutesOfDayIn, todayIn, weekdayIn } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Asistencia · nerd" };

export default async function AttendancePage() {
  const user = await requireUser();

  const date = todayIn(user.timezone);
  const weekday = weekdayIn(user.timezone);
  const nowMinutes = minutesOfDayIn(user.timezone);

  const [byCourse, sessions] = await Promise.all([
    getAttendanceByCourse(user),
    getSessionsForDate(user.id, date, weekday),
  ]);

  if (byCourse.length === 0) {
    return (
      <>
        <PageHeader title="Asistencia" />
        <EmptyState
          title="Todavía no hay materias"
          description="La asistencia se cuelga de tu horario: crea tus materias y sus clases."
          action={
            <Link href="/materias" className={buttonVariants({ variant: "primary" })}>
              Agregar materias
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Asistencia"
        description={`Mínimo general: ${user.defaultMinAttendancePct}%. Cada materia puede tener el suyo.`}
      />

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Clases de hoy</h2>
        <TodaySessions
          sessions={sessions}
          date={date}
          nowMinutes={nowMinutes}
          trackLates={user.trackLates}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Por materia</h2>
        <p className="mb-4 text-[13px] text-text-secondary">
          Ordenadas por riesgo: primero las que están más cerca del límite.
        </p>
        <ul className="space-y-3">
          {byCourse.map(({ course, summary }) => (
            <li key={course.id} className="rounded-card border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={cn("size-2.5 rounded-full", courseColor(course.color).dot)}
                  aria-hidden="true"
                />
                <Link href={`/materias/${course.id}`} className="text-[15px] hover:underline">
                  {course.name}
                </Link>
              </div>
              <AttendanceBar
                summary={summary}
                minPct={Number(course.minAttendancePct ?? user.defaultMinAttendancePct)}
                compact
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
