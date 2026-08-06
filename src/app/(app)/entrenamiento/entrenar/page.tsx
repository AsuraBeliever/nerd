import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AddExerciseToWorkout } from "@/features/training/components/add-exercise";
import { FinishWorkout } from "@/features/training/components/finish-workout";
import { SetLogger } from "@/features/training/components/set-logger";
import {
  getOpenWorkout,
  getRoutine,
  getWorkout,
  lastValuesByExercise,
  listExercises,
} from "@/features/training/queries";
import { formatWeight } from "@/features/training/units";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Entrenar · nerd" };

/** La pantalla que se usa de pie, entre series. Todo aquí es para el pulgar. */
export default async function ActiveWorkoutPage() {
  const user = await requireUser();

  const open = await getOpenWorkout(user.id);
  if (!open) redirect("/entrenamiento");

  const [workout, routine, lastValues, catalog] = await Promise.all([
    getWorkout(user.id, open.id),
    open.routineId ? getRoutine(user.id, open.routineId) : Promise.resolve(null),
    lastValuesByExercise(user.id),
    listExercises(user),
  ]);

  if (!workout) redirect("/entrenamiento");

  // Los ejercicios de la rutina, más cualquiera que se haya agregado al vuelo.
  const planned = routine?.items ?? [];
  const extraIds = [...new Set(workout.sets.map((s) => s.exerciseId))].filter(
    (id) => !planned.some((p) => p.exercise.id === id),
  );

  const cards = [
    ...planned.map((item) => ({
      exerciseId: item.exercise.id,
      name: item.exercise.name,
      trackingType: item.exercise.trackingType,
      target: describeTarget(item, user.weightUnit),
    })),
    ...extraIds.map((id) => {
      const exercise = workout.sets.find((s) => s.exerciseId === id)?.exercise;
      return {
        exerciseId: id,
        name: exercise?.name ?? "Ejercicio",
        trackingType: exercise?.trackingType ?? ("weight_reps" as const),
        target: null,
      };
    }),
  ];

  return (
    <>
      <PageHeader
        title={routine?.name ?? "Sesión libre"}
        description="Registra cada serie en cuanto la termines."
      />

      <div className="space-y-4">
        {cards.map((card) => (
          <SetLogger
            key={card.exerciseId}
            workoutId={workout.id}
            exerciseId={card.exerciseId}
            name={card.name}
            trackingType={card.trackingType}
            unit={user.weightUnit}
            target={card.target}
            lastValues={lastValues.get(card.exerciseId) ?? null}
            sets={workout.sets
              .filter((s) => s.exerciseId === card.exerciseId)
              .map((s) => ({
                id: s.id,
                reps: s.reps,
                weightKg: s.weightKg,
                durationSeconds: s.durationSeconds,
                isWarmup: s.isWarmup,
              }))}
          />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <AddExerciseToWorkout
          workoutId={workout.id}
          exercises={catalog
            .filter((e) => !cards.some((c) => c.exerciseId === e.id))
            .map((e) => ({ id: e.id, name: e.name }))}
        />
        <FinishWorkout workoutId={workout.id} />
      </div>
    </>
  );
}

function describeTarget(
  item: {
    targetSets: number;
    targetRepsMin: number | null;
    targetRepsMax: number | null;
    targetWeightKg: string | null;
  },
  unit: "kg" | "lb",
): string {
  const reps =
    item.targetRepsMin && item.targetRepsMax
      ? item.targetRepsMin === item.targetRepsMax
        ? `${item.targetRepsMin}`
        : `${item.targetRepsMin}-${item.targetRepsMax}`
      : "—";
  const weight = item.targetWeightKg ? ` · ${formatWeight(Number(item.targetWeightKg), unit)}` : "";
  return `${item.targetSets} × ${reps}${weight}`;
}
