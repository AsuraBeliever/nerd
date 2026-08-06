const COURSE_COLORS = [
  { name: "blue", className: "bg-course-blue" },
  { name: "emerald", className: "bg-course-emerald" },
  { name: "amber", className: "bg-course-amber" },
  { name: "rose", className: "bg-course-rose" },
  { name: "violet", className: "bg-course-violet" },
  { name: "cyan", className: "bg-course-cyan" },
  { name: "orange", className: "bg-course-orange" },
  { name: "lime", className: "bg-course-lime" },
] as const;

const MODULES = [
  { name: "Horario", phase: "Fase 2", detail: "Materias y bloques de clase" },
  { name: "Asistencia", phase: "Fase 3", detail: "Faltas restantes antes del límite" },
  { name: "Tareas", phase: "Fase 4", detail: "Entregas y exámenes por materia" },
  { name: "Pendientes", phase: "Fase 5", detail: "To-do list personal" },
  { name: "Entrenamiento", phase: "Fase 8", detail: "Rutinas y progreso" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto min-h-dvh max-w-[1100px] px-6 py-16 sm:px-8">
      <header className="mb-16">
        <p className="text-xs font-medium tracking-widest text-text-subtle uppercase">
          Fase 0 · Cimientos
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">nerd</h1>
        <p className="mt-2 max-w-prose text-[15px] text-text-secondary">
          El proyecto está montado y el sistema de diseño en pie. Todavía no hay funcionalidad —
          esto es el piso sobre el que se construye todo lo demás.
        </p>
      </header>

      <section className="mb-14">
        <h2 className="mb-4 text-[13px] font-medium text-text-subtle">Módulos planeados</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {MODULES.map((module) => (
            <li key={module.name} className="flex items-center gap-4 px-4 py-3">
              <span className="flex-1 text-[15px]">{module.name}</span>
              <span className="hidden text-[13px] text-text-secondary sm:block">
                {module.detail}
              </span>
              <span className="rounded-control bg-surface-subtle px-2 py-0.5 text-xs text-text-subtle">
                {module.phase}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-14">
        <h2 className="mb-4 text-[13px] font-medium text-text-subtle">Paleta de materias</h2>
        <div className="flex flex-wrap gap-2">
          {COURSE_COLORS.map((color) => (
            <div
              key={color.name}
              className="flex items-center gap-2 text-[13px] text-text-secondary"
            >
              <span className={`size-3 rounded-full ${color.className}`} aria-hidden="true" />
              {color.name}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="mb-4 text-[13px] font-medium text-text-subtle">
          Color semántico — solo donde hay riesgo real
        </h2>
        <div className="flex flex-wrap gap-4 text-[13px]">
          <span className="text-danger">Vencida · queda 1 falta</span>
          <span className="text-warning">Vence hoy · quedan 3 faltas</span>
          <span className="text-text-secondary">Esta semana</span>
          <span className="text-text-subtle">Sin fecha</span>
        </div>
      </section>

      <footer className="border-t border-border pt-6 text-[13px] text-text-subtle">
        Claro y oscuro siguen la preferencia de tu sistema. Todo lo demás está en{" "}
        <code className="font-mono text-text-secondary">docs/</code>.
      </footer>
    </main>
  );
}
