import type { ScheduleBlock } from "@/features/courses/queries";
import { courseColor } from "@/lib/course-colors";
import { formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { currentClassStatus } from "../lib";

function humanMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/**
 * "¿Qué clase tengo ahora?" — la pregunta más frecuente de la app,
 * contestada sin que el usuario tenga que buscar nada.
 */
export function NextClass({
  blocks,
  weekday,
  minutesNow,
}: {
  blocks: ScheduleBlock[];
  weekday: number;
  minutesNow: number;
}) {
  const status = currentClassStatus(blocks, weekday, minutesNow);

  if (status.kind === "done") {
    return (
      <p className="rounded-card border border-border bg-surface px-4 py-3 text-[15px] text-text-secondary">
        {blocks.some((b) => b.weekday === weekday)
          ? "Ya no tienes clases hoy"
          : "Hoy no tienes clases"}
      </p>
    );
  }

  const block = status.block;
  const color = courseColor(block.course.color);
  const room = block.room ?? block.course.room;

  return (
    <div className={cn("rounded-card border px-4 py-3", color.border, color.bg)}>
      <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
        {status.kind === "in-class" ? "En clase ahora" : "Siguiente clase"}
      </p>
      <p className="mt-1 text-[17px] font-semibold">{block.course.name}</p>
      <p className="text-[13px] text-text-secondary">
        {formatTime(block.startTime)}–{formatTime(block.endTime)}
        {room && ` · ${room}`}
        {" · "}
        {status.kind === "in-class"
          ? `termina en ${humanMinutes(status.minutesLeft)}`
          : `en ${humanMinutes(status.minutesUntil)}`}
      </p>
    </div>
  );
}
