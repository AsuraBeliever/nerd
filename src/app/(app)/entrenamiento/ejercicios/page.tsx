import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import type { Equipment, MuscleGroup } from "@/db/schema";
import { listExercises } from "@/features/training/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Ejercicios · nerd" };

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: "Pecho",
  back: "Espalda",
  legs: "Pierna",
  shoulders: "Hombros",
  arms: "Brazos",
  core: "Core",
  cardio: "Cardio",
  full_body: "Cuerpo completo",
};

const EQUIPMENT_LABEL: Record<Equipment, string> = {
  bodyweight: "Peso corporal",
  dumbbell: "Mancuernas",
  resistance_band: "Banda",
  kettlebell: "Kettlebell",
  pullup_bar: "Barra de dominadas",
  barbell: "Barra",
  machine: "Máquina",
  cable: "Polea",
  other: "Otro",
};

export default async function ExercisesPage() {
  const user = await requireUser();
  const exercises = await listExercises(user);
  const filtered = (user.availableEquipment?.length ?? 0) > 0;

  const byGroup = new Map<MuscleGroup, typeof exercises>();
  for (const exercise of exercises) {
    byGroup.set(exercise.muscleGroup, [...(byGroup.get(exercise.muscleGroup) ?? []), exercise]);
  }

  return (
    <>
      <Link href="/entrenamiento" className="text-[13px] text-text-secondary hover:underline">
        ← Entrenamiento
      </Link>
      <div className="mt-3">
        <PageHeader
          title="Ejercicios"
          description={
            filtered
              ? "Filtrados por el equipo que tienes. Cambia tu equipo en Ajustes para ver más."
              : "El catálogo completo. Elige tu equipo en Ajustes para ver solo lo que puedes hacer."
          }
          action={
            <Link href="/ajustes" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Mi equipo
            </Link>
          }
        />
      </div>

      <div className="space-y-8">
        {[...byGroup.entries()].map(([group, items]) => (
          <section key={group}>
            <h2 className="mb-2 text-[13px] font-medium text-text-subtle">{MUSCLE_LABEL[group]}</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
              {items.map((exercise) => (
                <li key={exercise.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[15px]">{exercise.name}</span>
                  <span className="shrink-0 text-[13px] text-text-subtle">
                    {EQUIPMENT_LABEL[exercise.equipment]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
