# `nerd` — Documentación del proyecto

Aplicación web personal para organizar la vida universitaria y el entrenamiento físico: horario escolar, tareas y exámenes por materia, pendientes generales, y registro de rutinas de ejercicio con seguimiento de progreso.

**Cliente:** AsuraBeliever · **Developer:** Claude · **Inicio:** 5 de agosto de 2026

---

## Por dónde empezar

Si estás retomando el proyecto, lee en este orden:

1. **[`BITACORA.md`](./BITACORA.md)** — qué se hizo la última sesión y qué sigue. **Siempre primero.**
2. [`01-vision-y-alcance.md`](./01-vision-y-alcance.md) — qué es esta app.
3. [`06-roadmap.md`](./06-roadmap.md) — el plan de construcción por fases.

## Índice completo

### Planeación
- [`01-vision-y-alcance.md`](./01-vision-y-alcance.md) — Problema, objetivos, alcance y no-alcance.
- [`06-roadmap.md`](./06-roadmap.md) — Las 9 fases del proyecto, con su rama y criterios de terminado.

### Técnico
- [`02-stack.md`](./02-stack.md) — Cada tecnología elegida y por qué esa y no otra.
- [`03-arquitectura.md`](./03-arquitectura.md) — Estructura de carpetas, capas y flujo de datos.
- [`04-modelo-de-datos.md`](./04-modelo-de-datos.md) — Todas las tablas, relaciones y reglas de integridad.
- [`09-decisiones.md`](./09-decisiones.md) — Registro de decisiones técnicas (ADR).

### Diseño
- [`05-diseno-ui.md`](./05-diseno-ui.md) — Sistema de diseño minimalista: color, tipografía, espacio, componentes.

### Proceso
- [`07-git-workflow.md`](./07-git-workflow.md) — Ramas, commits, versionado, releases.
- [`BITACORA.md`](./BITACORA.md) — Diario de sesiones y ramas estacionadas.

### Fichas de funcionalidad
- [`features/horario.md`](./features/horario.md) — Horario escolar.
- [`features/academico.md`](./features/academico.md) — Tareas, exámenes y proyectos por materia.
- [`features/pendientes.md`](./features/pendientes.md) — To-do list general.
- [`features/gimnasio.md`](./features/gimnasio.md) — Rutinas, registro de entrenamiento y progreso.
- [`features/dashboard.md`](./features/dashboard.md) — Pantalla de inicio, "hoy" y resumen.

---

## Resumen ejecutivo

| | |
|---|---|
| **Stack** | Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui · Drizzle · PostgreSQL (Neon) · Auth.js + Google |
| **Hosting** | Vercel (producción) + Neon (base de datos) — ambos en plan gratuito |
| **Usuarios** | Multiusuario, login con Google |
| **Dispositivos** | Responsive completo (móvil + escritorio) + PWA instalable |
| **Diseño** | Minimalista |
| **Módulos v1** | Horario · Académico · Pendientes · Gimnasio · Dashboard |
