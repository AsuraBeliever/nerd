import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StartWorkout } from "@/features/training/components/start-workout";
import { currentStreak, weeklyVolume } from "@/features/training/lib";
import {
  allSets,
  getOpenWorkout,
  latestBodyweightKg,
  listRoutines,
  listWorkouts,
} from "@/features/training/queries";
import { formatWeight } from "@/features/training/units";
import { shortDate } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Entrenamiento · nerd" };

export default async function TrainingPage() {
  const user = await requireUser();

  const [open, routines, recent, sets, bodyweight] = await Promise.all([
    getOpenWorkout(user.id),
    listRoutines(user.id),
    listWorkouts(user.id, 5),
    allSets(user.id),
    latestBodyweightKg(user.id),
  ]);

  const weeks = weeklyVolume(sets, user.weekStartsOn, bodyweight);
  const streak = currentStreak(
    weeks.map((w) => w.week),
    user.weekStartsOn,
  );

  return (
    <>
      <PageHeader
        title="Entrenamiento"
        action={
          <div className="flex gap-2">
            <Link
              href="/entrenamiento/progreso"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Progreso
            </Link>
            <Link
              href="/entrenamiento/rutinas"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Rutinas
            </Link>
          </div>
        }
      />

      {open ? (
        <Link
          href="/entrenamiento/entrenar"
          className="mb-8 flex items-center gap-3 rounded-card border border-accent bg-accent/10 px-4 py-4 text-[15px] font-medium"
        >
          Tienes una sesión en curso — continuar
          <ChevronRight className="ml-auto size-4" aria-hidden="true" />
        </Link>
      ) : (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Entrenar</h2>
          {routines.length === 0 ? (
            <EmptyState
              title="Todavía no tienes rutinas"
              description="Crea una rutina con tus ejercicios, o empieza una sesión libre y ve agregándolos sobre la marcha."
              action={
                <Link
                  href="/entrenamiento/rutinas"
                  className={buttonVariants({ variant: "primary" })}
                >
                  Crear mi primera rutina
                </Link>
              }
            />
          ) : (
            <StartWorkout routines={routines} />
          )}
        </section>
      )}

      <section className="mb-10 grid gap-3 sm:grid-cols-3">
        <Stat label="Racha" value={streak === 0 ? "—" : `${streak} sem`} />
        <Stat
          label="Volumen esta semana"
          value={weeks.length > 0 ? `${Math.round(weeks[weeks.length - 1]?.volume ?? 0)} kg` : "—"}
        />
        <Stat label="Peso corporal" value={formatWeight(bodyweight, user.weightUnit)} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimas sesiones</h2>
          <Link
            href="/entrenamiento/historial"
            className="text-[13px] text-text-secondary hover:underline"
          >
            Ver todas
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-[15px] text-text-secondary">
            Todavía no has registrado entrenamientos.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
            {recent.map((workout) => (
              <li key={workout.id} className="px-4 py-3">
                <p className="text-[15px]">{shortDate(workout.startedAt, user.timezone)}</p>
                <p className="text-[13px] text-text-subtle">
                  {workout.setCount} {workout.setCount === 1 ? "serie" : "series"}
                  {!workout.endedAt && " · en curso"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3">
      <p className="text-[13px] text-text-subtle">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
