import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { signOut } from "@/lib/auth";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Ajustes · nerd" };

export default async function SettingsPage() {
  const user = await requireUser();

  async function cerrarSesion() {
    "use server";
    await signOut({ redirectTo: "/entrar" });
  }

  return (
    <>
      <PageHeader
        title="Ajustes"
        description="La app se adapta a ti, no al revés. Todo lo de aquí es tuyo y puedes cambiarlo cuando quieras."
      />

      <div className="mb-8 flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px]">{user.name ?? "Sin nombre"}</p>
          <p className="truncate text-[13px] text-text-subtle">{user.email}</p>
        </div>
        <form action={cerrarSesion}>
          <Button type="submit" variant="secondary" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </div>

      <SettingsForm
        initial={{
          timezone: user.timezone,
          weekStartsOn: user.weekStartsOn,
          visibleWeekdays: user.visibleWeekdays,
          theme: user.theme,
          defaultMinAttendancePct: user.defaultMinAttendancePct,
          excusedCountsAsPresent: user.excusedCountsAsPresent,
          trackLates: user.trackLates,
          latesPerAbsence: user.latesPerAbsence,
          trackGrades: user.trackGrades,
          weightUnit: user.weightUnit,
          availableEquipment: user.availableEquipment,
        }}
      />
    </>
  );
}
