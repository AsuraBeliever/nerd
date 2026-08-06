# nerd

App web para organizar la universidad y el entrenamiento: **horario escolar**, **asistencia y faltas**, **tareas y exámenes por materia**, **pendientes personales** y **registro de entrenamiento con seguimiento de progreso**.

**Estado:** en planeación (Fase 0 de 11) · **Versión:** 0.0.1

## Qué la hace distinta

- Responde preguntas, no muestra tablas: *"¿qué clase sigue?"*, *"¿cuántas faltas me quedan?"*, *"¿voy mejorando?"*.
- **Todo configurable:** días de la semana, inicio de semana, porcentaje mínimo de asistencia por materia, kilos o libras, equipo de entrenamiento disponible. Nada codificado a la medida de una sola persona.
- Pensada para **entrenar en casa** tanto como en gimnasio: mide progreso por repeticiones y tiempo, no solo por peso levantado.
- Diseño minimalista, responsive, instalable como PWA.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · PostgreSQL (Neon) · Auth.js + Google · Vercel

## Documentación

Todo el proyecto está documentado en [`docs/`](./docs/README.md).

| | |
|---|---|
| [Visión y alcance](./docs/01-vision-y-alcance.md) | Qué es y qué no es |
| [Stack técnico](./docs/02-stack.md) | Cada elección, justificada |
| [Arquitectura](./docs/03-arquitectura.md) | Capas, carpetas y flujo de datos |
| [Modelo de datos](./docs/04-modelo-de-datos.md) | Tablas y reglas |
| [Sistema de diseño](./docs/05-diseno-ui.md) | Color, tipografía, componentes |
| [Roadmap](./docs/06-roadmap.md) | 12 fases, una rama cada una |
| [Flujo de git](./docs/07-git-workflow.md) | Ramas, commits, versionado |
| [Seguridad](./docs/08-seguridad.md) | Repo público: qué nunca se commitea |
| [Decisiones](./docs/09-decisiones.md) | 14 ADRs |
| [Bitácora](./docs/BITACORA.md) | Diario de sesiones |

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar con valores propios
npm run dev                  # http://localhost:3000
```

*(Disponible a partir de la Fase 0.)*

> **Nota de seguridad:** este repositorio es público. Nunca se commitean credenciales ni datos personales. Ver [`docs/08-seguridad.md`](./docs/08-seguridad.md).

## Licencia

MIT — ver [LICENSE](./LICENSE).
