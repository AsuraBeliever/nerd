import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getSchedule } from "@/features/courses/queries";
import { DaySchedule } from "@/features/schedule/components/day-schedule";
import { NextClass } from "@/features/schedule/components/next-class";
import { ScheduleGrid } from "@/features/schedule/components/schedule-grid";
import { visibleWeekdays } from "@/features/schedule/lib";
import { minutesOfDayIn, orderedWeekdays, weekdayIn } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Horario · nerd" };

export default async function SchedulePage() {
  const user = await requireUser();
  const blocks = await getSchedule(user.id);

  const weekOrder = orderedWeekdays(user.weekStartsOn);
  const days = visibleWeekdays(blocks, user.visibleWeekdays, weekOrder);
  const today = weekdayIn(user.timezone);
  const nowMinutes = minutesOfDayIn(user.timezone);

  if (blocks.length === 0) {
    return (
      <>
        <PageHeader title="Horario" />
        <EmptyState
          title="Todavía no hay clases en tu horario"
          description="Crea tus materias y agrégales sus horas de clase. Los siete días de la semana están disponibles."
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
        title="Horario"
        action={
          <Link href="/materias" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Editar materias
          </Link>
        }
      />

      <div className="mb-6">
        <NextClass blocks={blocks} weekday={today} minutesNow={nowMinutes} />
      </div>

      {/* Móvil: un día a la vez. Escritorio: la semana completa. */}
      <div className="md:hidden">
        <DaySchedule
          days={days}
          today={today}
          nowMinutes={nowMinutes}
          blocks={blocks.map((b) => ({
            id: b.id,
            weekday: b.weekday,
            startTime: b.startTime,
            endTime: b.endTime,
            room: b.room,
            courseName: b.course.name,
            courseColor: b.course.color,
            courseRoom: b.course.room,
            teacher: b.course.teacher,
          }))}
        />
      </div>
      <div className="hidden md:block">
        <ScheduleGrid blocks={blocks} days={days} nowWeekday={today} nowMinutes={nowMinutes} />
      </div>
    </>
  );
}
