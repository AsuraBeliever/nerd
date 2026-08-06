"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { courseColor } from "@/lib/course-colors";
import { formatTime, weekdayName } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type DayBlock = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string | null;
  courseName: string;
  courseColor: string;
  courseRoom: string | null;
  teacher: string | null;
};

/**
 * Vista de un día (móvil). Se navega entre días con los botones o
 * deslizando; abre en el día de hoy.
 */
export function DaySchedule({
  blocks,
  days,
  today,
  nowMinutes,
}: {
  blocks: DayBlock[];
  days: number[];
  today: number;
  nowMinutes: number;
}) {
  const initial = Math.max(days.indexOf(today), 0);
  const [index, setIndex] = useState(initial);
  const day = days[index] ?? days[0] ?? 1;
  const dayBlocks = blocks.filter((b) => b.weekday === day);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label="Día anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-[15px] font-medium">
          {weekdayName(day)}
          {day === today && <span className="ml-2 text-[13px] text-accent">hoy</span>}
        </p>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setIndex((i) => Math.min(days.length - 1, i + 1))}
          disabled={index === days.length - 1}
          aria-label="Día siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {dayBlocks.length === 0 ? (
        <EmptyState title="Sin clases este día" />
      ) : (
        <ul className="space-y-2">
          {dayBlocks.map((block) => {
            const color = courseColor(block.courseColor);
            const isNow =
              day === today &&
              nowMinutes >= toMinutes(block.startTime) &&
              nowMinutes < toMinutes(block.endTime);
            return (
              <li
                key={block.id}
                className={cn(
                  "flex gap-3 rounded-card border p-3",
                  isNow ? "border-accent" : "border-border",
                )}
              >
                <span className={cn("mt-1 h-full w-1 shrink-0 rounded-full", color.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{block.courseName}</p>
                  <p className="text-[13px] text-text-secondary">
                    {formatTime(block.startTime)}–{formatTime(block.endTime)}
                    {(block.room ?? block.courseRoom) && ` · ${block.room ?? block.courseRoom}`}
                  </p>
                  {block.teacher && <p className="text-xs text-text-subtle">{block.teacher}</p>}
                </div>
                {isNow && <span className="text-xs font-medium text-accent">Ahora</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function toMinutes(time: string) {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
}
