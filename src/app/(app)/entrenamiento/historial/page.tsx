import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { BodyweightForm } from "@/features/training/components/bodyweight-form";
import { listWorkouts } from "@/features/training/queries";
import { longDate } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Historial · nerd" };

export default async function HistoryPage() {
  const user = await requireUser();
  const workouts = await listWorkouts(user.id, 60);

  return (
    <>
      <Link href="/entrenamiento" className="text-[13px] text-text-secondary hover:underline">
        ← Entrenamiento
      </Link>
      <div className="mt-3">
        <PageHeader title="Historial" />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Peso corporal</h2>
        <BodyweightForm unit={user.weightUnit} timezone={user.timezone} />
      </section>

      <h2 className="mb-3 text-lg font-semibold">Sesiones</h2>
      {workouts.length === 0 ? (
        <EmptyState title="Todavía no has registrado entrenamientos" />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {workouts.map((workout) => (
            <li key={workout.id} className="px-4 py-3">
              <p className="text-[15px]">
                {capitalize(longDate(workout.startedAt, user.timezone))}
              </p>
              <p className="text-[13px] text-text-subtle">
                {workout.setCount} {workout.setCount === 1 ? "serie" : "series"}
                {workout.endedAt
                  ? ` · ${minutes(workout.startedAt, workout.endedAt)} min`
                  : " · en curso"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function minutes(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
