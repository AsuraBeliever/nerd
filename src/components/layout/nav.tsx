"use client";

import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Dumbbell,
  Home,
  ListTodo,
  Settings,
  SquareCheckBig,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof Home };

/** Todo lo que aparece en la barra lateral de escritorio. */
const ALL: Item[] = [
  { href: "/", label: "Hoy", icon: Home },
  { href: "/horario", label: "Horario", icon: CalendarDays },
  { href: "/materias", label: "Materias", icon: BookOpen },
  { href: "/asistencia", label: "Asistencia", icon: SquareCheckBig },
  { href: "/tareas", label: "Tareas", icon: CheckSquare },
  { href: "/pendientes", label: "Pendientes", icon: ListTodo },
  { href: "/entrenamiento", label: "Entrenar", icon: Dumbbell },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

/** Los 5 destinos de la barra inferior en móvil, donde alcanza el pulgar. */
const MOBILE: Item[] = [
  ALL[0] as Item,
  ALL[1] as Item,
  ALL[4] as Item,
  ALL[6] as Item,
  ALL[7] as Item,
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="hidden w-56 shrink-0 border-r border-border px-3 py-6 md:block"
    >
      <p className="px-3 pb-6 text-lg font-semibold tracking-tight">nerd</p>
      <ul className="space-y-0.5">
        {ALL.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-control px-3 py-2 text-[15px] transition-colors",
                isActive(pathname, href)
                  ? "bg-surface-subtle font-medium text-text"
                  : "text-text-secondary hover:bg-surface-subtle hover:text-text",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BottomBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {MOBILE.map(({ href, label, icon: Icon }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "flex min-h-[3.5rem] flex-col items-center justify-center gap-1 text-[11px]",
                isActive(pathname, href) ? "text-accent" : "text-text-subtle",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
