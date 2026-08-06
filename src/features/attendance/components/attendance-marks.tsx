"use client";

import { Check, Clock, X } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import type { AttendanceStatus } from "@/db/schema";
import { cn } from "@/lib/utils";
import { clearAttendance, markAttendance } from "../actions";

/**
 * Registro de un toque. Los botones que se muestran dependen de las
 * preferencias: si el usuario apagó los retardos, "Tarde" ni aparece —
 * la interfaz se encoge en vez de dejar opciones muertas.
 */
export function AttendanceMarks({
  courseId,
  blockId,
  date,
  status,
  recordId,
  trackLates,
}: {
  courseId: string;
  blockId: string | null;
  date: string;
  status: AttendanceStatus | null;
  recordId: string | null;
  trackLates: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, start] = useTransition();

  function mark(next: AttendanceStatus) {
    const undo = optimistic === next;
    start(async () => {
      setOptimistic(undo ? null : next);
      // Volver a tocar el mismo botón borra el registro: la sesión regresa a
      // "sin registrar", que no cuenta como falta. No se guarda "cancelada",
      // que significa otra cosa (la clase no se dio).
      if (undo && recordId) await clearAttendance(recordId);
      else await markAttendance({ courseId, blockId, date, status: next, notes: null });
    });
  }

  const options: { status: AttendanceStatus; label: string; icon: typeof Check; on: string }[] = [
    { status: "present", label: "Asistí", icon: Check, on: "border-success text-success" },
    { status: "absent", label: "Falté", icon: X, on: "border-danger text-danger" },
    ...(trackLates
      ? [
          {
            status: "late" as const,
            label: "Tarde",
            icon: Clock,
            on: "border-warning text-warning",
          },
        ]
      : []),
  ];

  return (
    <div className="flex gap-2">
      {options.map(({ status: value, label, icon: Icon, on }) => {
        const active = optimistic === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => mark(value)}
            aria-pressed={active}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-control border text-[13px] font-medium transition-colors",
              active ? on : "border-border text-text-secondary hover:bg-surface-subtle",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
