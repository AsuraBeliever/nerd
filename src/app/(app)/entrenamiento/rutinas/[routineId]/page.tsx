import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { RoutineEditor } from "@/features/training/components/routine-editor";
import { getRoutine, listExercises } from "@/features/training/queries";
import { requireUser } from "@/lib/session";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;
  const user = await requireUser();

  const [routine, exercises] = await Promise.all([
    getRoutine(user.id, routineId),
    listExercises(user),
  ]);
  if (!routine) notFound();

  return (
    <>
      <Link
        href="/entrenamiento/rutinas"
        className="text-[13px] text-text-secondary hover:underline"
      >
        ← Rutinas
      </Link>
      <div className="mt-3">
        <PageHeader title={routine.name} description={routine.description ?? undefined} />
      </div>

      <RoutineEditor
        routineId={routine.id}
        unit={user.weightUnit}
        exercises={exercises.map((e) => ({ id: e.id, name: e.name }))}
        items={routine.items.map((item) => ({
          id: item.id,
          exerciseName: item.exercise.name,
          usesWeight: item.exercise.trackingType === "weight_reps",
          targetSets: item.targetSets,
          targetRepsMin: item.targetRepsMin,
          targetRepsMax: item.targetRepsMax,
          targetWeightKg: item.targetWeightKg,
          restSeconds: item.restSeconds,
        }))}
      />
    </>
  );
}
