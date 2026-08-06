import { EmptyState } from "@/components/shared/empty-state";
import { courseColor } from "@/lib/course-colors";
import { formatTime, timeToMinutes } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TodaySession } from "../queries";
import { AttendanceMarks } from "./attendance-marks";

/**
 * Clases del día con sus botones de asistencia.
 *
 * Solo se pueden marcar las que ya terminaron: registrar una clase que no
 * ha ocurrido no tiene sentido.
 */
export function TodaySessions({
  sessions,
  date,
  nowMinutes,
  trackLates,
}: {
  sessions: TodaySession[];
  date: string;
  nowMinutes: number;
  trackLates: boolean;
}) {
  if (sessions.length === 0) {
    return <EmptyState title="Hoy no tienes clases" />;
  }

  return (
    <ul className="space-y-3">
      {sessions.map((session) => {
        const ended = nowMinutes >= timeToMinutes(session.endTime);
        const inProgress = !ended && nowMinutes >= timeToMinutes(session.startTime);
        const color = courseColor(session.courseColor);

        return (
          <li
            key={session.blockId}
            className={cn(
              "rounded-card border p-3",
              inProgress ? "border-accent" : "border-border",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn("size-2.5 shrink-0 rounded-full", color.dot)}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{session.courseName}</p>
                <p className="text-[13px] text-text-secondary">
                  {formatTime(session.startTime)}–{formatTime(session.endTime)}
                  {session.room && ` · ${session.room}`}
                </p>
              </div>
              {inProgress && <span className="text-xs font-medium text-accent">Ahora</span>}
            </div>

            {ended ? (
              <div className="mt-3">
                <AttendanceMarks
                  courseId={session.courseId}
                  blockId={session.blockId}
                  date={date}
                  status={session.status}
                  recordId={session.recordId}
                  trackLates={trackLates}
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-text-subtle">
                Podrás marcar tu asistencia cuando termine la clase.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
