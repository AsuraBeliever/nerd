import type { ScheduleBlock } from "@/features/courses/queries";
import { courseColor } from "@/lib/course-colors";
import { formatTime, minutesToTime, timeToMinutes, weekdayName } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { blocksOfDay, gridTimeRange } from "../lib";

const PX_PER_MINUTE = 1;

/**
 * Cuadrícula semanal (escritorio). Las filas van de la primera a la última
 * clase del usuario, no de 0 a 24: el rango sale de sus datos.
 */
export function ScheduleGrid({
  blocks,
  days,
  nowWeekday,
  nowMinutes,
}: {
  blocks: ScheduleBlock[];
  days: number[];
  nowWeekday: number;
  nowMinutes: number;
}) {
  const { startMinutes, endMinutes } = gridTimeRange(blocks);
  const height = (endMinutes - startMinutes) * PX_PER_MINUTE;

  const hours: number[] = [];
  for (let m = startMinutes; m <= endMinutes; m += 60) hours.push(m);

  const showNowLine =
    days.includes(nowWeekday) && nowMinutes >= startMinutes && nowMinutes <= endMinutes;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[44rem] gap-px">
        {/* Columna de horas */}
        <div className="w-14 shrink-0" style={{ paddingTop: 32 }}>
          <div className="relative" style={{ height }}>
            {hours.map((m) => (
              <div
                key={m}
                className="absolute -translate-y-1/2 text-right text-xs text-text-subtle"
                style={{ top: (m - startMinutes) * PX_PER_MINUTE, right: 8 }}
              >
                {formatTime(minutesToTime(m))}
              </div>
            ))}
          </div>
        </div>

        {days.map((day) => {
          const dayBlocks = blocksOfDay(blocks, day);
          return (
            <div key={day} className="min-w-0 flex-1">
              <div
                className={cn(
                  "pb-2 text-center text-[13px] font-medium",
                  day === nowWeekday ? "text-text" : "text-text-secondary",
                )}
              >
                {weekdayName(day)}
              </div>
              <div
                className="relative rounded-card border border-border bg-surface-subtle/40"
                style={{ height }}
              >
                {hours.map((m) => (
                  <div
                    key={m}
                    className="absolute inset-x-0 border-t border-border/60"
                    style={{ top: (m - startMinutes) * PX_PER_MINUTE }}
                  />
                ))}

                {showNowLine && day === nowWeekday && (
                  <div
                    className="absolute inset-x-0 z-10 border-t-2 border-accent"
                    style={{ top: (nowMinutes - startMinutes) * PX_PER_MINUTE }}
                    aria-hidden="true"
                  />
                )}

                {dayBlocks.map((block) => {
                  const top = (timeToMinutes(block.startTime) - startMinutes) * PX_PER_MINUTE;
                  const blockHeight =
                    (timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) * PX_PER_MINUTE;
                  const color = courseColor(block.course.color);
                  return (
                    <div
                      key={block.id}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-control border px-2 py-1",
                        color.bg,
                        color.border,
                      )}
                      style={{ top, height: Math.max(blockHeight, 28) }}
                    >
                      <p className="truncate text-[13px] font-medium">{block.course.name}</p>
                      <p className="truncate text-xs text-text-secondary">
                        {formatTime(block.startTime)}–{formatTime(block.endTime)}
                      </p>
                      {(block.room ?? block.course.room) && (
                        <p className="truncate text-xs text-text-subtle">
                          {block.room ?? block.course.room}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
