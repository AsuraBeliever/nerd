import Link from "next/link";
import { BarChart, LineChart } from "@/components/shared/chart";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  currentStreak,
  personalRecord,
  progressSeries,
  TREND_LABEL,
  volumeTrend,
  weeklyVolume,
} from "@/features/training/lib";
import { allSets, latestBodyweightKg, listBodyMetrics } from "@/features/training/queries";
import { formatWeight } from "@/features/training/units";
import { shortDate } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Progreso · nerd" };

/** La pantalla que contesta "¿voy mejorando o empeorando?". */
export default async function ProgressPage() {
  const user = await requireUser();

  const [sets, bodyweight, metrics] = await Promise.all([
    allSets(user.id),
    latestBodyweightKg(user.id),
    listBodyMetrics(user.id),
  ]);

  if (sets.length === 0) {
    return (
      <>
        <PageHeader title="Progreso" />
        <EmptyState
          title="Todavía no hay nada que medir"
          description="Registra algunos entrenamientos y aquí vas a ver si estás mejorando."
        />
      </>
    );
  }

  const weeks = weeklyVolume(sets, user.weekStartsOn, bodyweight);
  const trend = volumeTrend(weeks);
  const streak = currentStreak(
    weeks.map((w) => w.week),
    user.weekStartsOn,
  );

  // Un resumen por ejercicio, con la métrica que le toca a su tipo.
  const byExercise = new Map<string, typeof sets>();
  for (const set of sets) {
    byExercise.set(set.exerciseId, [...(byExercise.get(set.exerciseId) ?? []), set]);
  }

  const exerciseCards = [...byExercise.entries()]
    .map(([id, exerciseSets]) => {
      const exercise = exerciseSets[0]?.exercise;
      if (!exercise) return null;
      const points = progressSeries(exerciseSets, exercise.trackingType, bodyweight);
      const record = personalRecord(exerciseSets, exercise.trackingType, bodyweight);
      return { id, exercise, points, record };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null && card.points.length > 0)
    .sort((a, b) => b.points.length - a.points.length);

  return (
    <>
      <Link href="/entrenamiento" className="text-[13px] text-text-secondary hover:underline">
        ← Entrenamiento
      </Link>
      <div className="mt-3">
        <PageHeader title="Progreso" />
      </div>

      {/* El veredicto va primero y en palabras, no en una gráfica. */}
      <section className="mb-10 rounded-card border border-border bg-surface p-5">
        <p className="text-[13px] text-text-subtle">Últimas 4 semanas</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold",
            trend.direction === "up" && "text-success",
            trend.direction === "down" && "text-danger",
          )}
        >
          {TREND_LABEL[trend.direction]}
        </p>
        <p className="mt-1 text-[15px] text-text-secondary">
          {trend.direction === "unknown"
            ? "Necesitas unas 8 semanas de historial para que la comparación signifique algo."
            : `Volumen ${trend.changePct && trend.changePct >= 0 ? "+" : ""}${trend.changePct?.toFixed(0)}% contra las 4 semanas anteriores.`}
        </p>
        {streak > 0 && (
          <p className="mt-3 text-[13px] text-text-secondary">
            Racha: {streak} {streak === 1 ? "semana" : "semanas"} seguidas entrenando.
          </p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Volumen por semana</h2>
        <BarChart
          points={weeks.slice(-12).map((w) => ({ label: w.week.slice(5), value: w.volume }))}
          suffix=" kg"
        />
      </section>

      {metrics.length > 1 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Peso corporal</h2>
          <LineChart
            points={metrics
              .filter((m) => m.weightKg)
              .map((m) => ({ label: m.date.slice(5), value: Number(m.weightKg) }))}
            suffix={` ${user.weightUnit}`}
          />
        </section>
      )}

      <section>
        <h2 className="mb-1 text-lg font-semibold">Por ejercicio</h2>
        <p className="mb-4 text-[13px] text-text-secondary">
          Cada ejercicio se mide como corresponde: fuerza donde hay carga, repeticiones donde no la
          hay, tiempo en los isométricos.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {exerciseCards.map((card) => (
            <article key={card.id} className="rounded-card border border-border bg-surface p-4">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <h3 className="truncate text-[15px] font-medium">{card.exercise.name}</h3>
                <span className="shrink-0 text-xs text-text-subtle">
                  {card.points[0]?.label ?? ""}
                </span>
              </div>
              {card.record && (
                <p className="mb-2 text-[13px] text-text-secondary">
                  Mejor marca:{" "}
                  {formatRecord(card.record.value, card.exercise.trackingType, user.weightUnit)} ·{" "}
                  {shortDate(card.record.date, user.timezone)}
                </p>
              )}
              <LineChart
                points={card.points.map((p) => ({ label: p.date.slice(5), value: p.value }))}
              />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function formatRecord(value: number, trackingType: string, unit: "kg" | "lb"): string {
  if (trackingType === "weight_reps") return formatWeight(value, unit);
  if (trackingType === "time") return `${Math.round(value)} s`;
  if (trackingType === "distance_time") return `${value.toFixed(1)} min/km`;
  return `${Math.round(value)} reps`;
}
