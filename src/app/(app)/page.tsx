import { PageHeader } from "@/components/shared/page-header";
import { longDate } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Hoy" description={longDate(new Date(), user.timezone)} />
      <p className="text-[15px] text-text-secondary">El resumen del día llega en la Fase 6.</p>
    </>
  );
}
