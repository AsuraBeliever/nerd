import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { RoutineList } from "@/features/training/components/routine-list";
import { listRoutines } from "@/features/training/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Rutinas · nerd" };

export default async function RoutinesPage() {
  const user = await requireUser();
  const routines = await listRoutines(user.id);

  return (
    <>
      <Link href="/entrenamiento" className="text-[13px] text-text-secondary hover:underline">
        ← Entrenamiento
      </Link>
      <div className="mt-3">
        <PageHeader title="Rutinas" />
      </div>
      <RoutineList routines={routines} />
    </>
  );
}
