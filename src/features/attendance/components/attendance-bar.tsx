import { cn } from "@/lib/utils";
import type { AttendanceSummary } from "../lib";

const LEVEL_TEXT = {
  none: "text-text-secondary",
  safe: "text-text",
  warning: "text-warning",
  critical: "text-danger",
  exceeded: "text-danger",
} as const;

const LEVEL_FILL = {
  none: "bg-border",
  safe: "bg-success",
  warning: "bg-warning",
  critical: "bg-danger",
  exceeded: "bg-danger",
} as const;

/** Cuántas faltas quedan, dicho en una frase, sin rodeos. */
export function remainingLabel(summary: AttendanceSummary): string {
  if (summary.remaining === null) {
    return summary.currentPct === null
      ? "Sin registros todavía"
      : "Agrega las fechas del semestre para saber cuántas faltas te quedan";
  }
  if (summary.remaining < 0) {
    const over = Math.abs(summary.remaining);
    return `Te pasaste por ${over} ${over === 1 ? "falta" : "faltas"}`;
  }
  if (summary.remaining === 0) return "No puedes faltar ni una vez más";
  return `Te ${summary.remaining === 1 ? "queda" : "quedan"} ${summary.remaining} ${
    summary.remaining === 1 ? "falta" : "faltas"
  }`;
}

/**
 * Lo más grande de la pantalla es la cifra que importa, no el porcentaje.
 * La marca del umbral deja ver de un vistazo qué tan cerca está del límite.
 */
export function AttendanceBar({
  summary,
  minPct,
  compact = false,
}: {
  summary: AttendanceSummary;
  minPct: number;
  compact?: boolean;
}) {
  const pct = summary.currentPct;

  return (
    <div>
      <p
        className={cn(
          "font-semibold",
          compact ? "text-[15px]" : "text-xl",
          LEVEL_TEXT[summary.level],
        )}
      >
        {remainingLabel(summary)}
      </p>

      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle">
        <div
          className={cn("h-full rounded-full transition-all", LEVEL_FILL[summary.level])}
          style={{ width: `${Math.min(pct ?? 0, 100)}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-text/50"
          style={{ left: `${Math.min(minPct, 100)}%` }}
          aria-hidden="true"
        />
      </div>

      <p className="mt-2 text-[13px] text-text-secondary">
        {pct === null ? "Sin sesiones registradas" : `${pct.toFixed(1)}% · mínimo ${minPct}%`}
      </p>

      {summary.considered > 0 && (
        <p className="mt-1 text-xs text-text-subtle">
          {summary.considered} {summary.considered === 1 ? "clase" : "clases"} ·{" "}
          {summary.counts.present} {summary.counts.present === 1 ? "asistencia" : "asistencias"} ·{" "}
          {summary.counts.absent} {summary.counts.absent === 1 ? "falta" : "faltas"}
          {summary.counts.excused > 0 && ` · ${summary.counts.excused} justificadas`}
          {summary.counts.late > 0 && ` · ${summary.counts.late} retardos`}
          {summary.totalSessions !== null && ` · de ${summary.totalSessions} en el semestre`}
        </p>
      )}
    </div>
  );
}
