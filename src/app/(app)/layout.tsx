import type { ReactNode } from "react";
import { BottomBar, Sidebar } from "@/components/layout/nav";
import { requireUser } from "@/lib/session";

/**
 * Guarda de sesión de toda la app: si no hay usuario, `requireUser` manda
 * al login antes de renderizar nada.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-[1100px] px-5 pt-8 pb-28 sm:px-8 md:pb-12">{children}</main>
      </div>
      <BottomBar />
    </div>
  );
}
