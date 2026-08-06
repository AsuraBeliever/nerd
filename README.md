# nerd

App web para organizar la universidad y el entrenamiento: **horario escolar**, **asistencia y faltas**, **tareas y exámenes por materia**, **pendientes personales** y **registro de entrenamiento con seguimiento de progreso**.

**Estado:** v1.0.0 construida y probada en local · pendiente de desplegar a producción

## Qué la hace distinta

- Responde preguntas, no muestra tablas: *"¿qué clase sigue?"*, *"¿cuántas faltas me quedan?"*, *"¿voy mejorando?"*.
- **Todo configurable:** días de la semana, inicio de semana, porcentaje mínimo de asistencia por materia, kilos o libras, equipo de entrenamiento disponible. Nada codificado a la medida de una sola persona.
- Pensada para **entrenar en casa** tanto como en gimnasio: mide progreso por repeticiones y tiempo, no solo por peso levantado.
- Diseño minimalista, responsive, instalable como PWA.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · PostgreSQL (Neon) · Auth.js + Google · Vercel

## Documentación

Todo el proyecto está documentado en [`docs/`](./docs/README.md).

| | |
|---|---|
| [Visión y alcance](./docs/01-vision-y-alcance.md) | Qué es y qué no es |
| [Stack técnico](./docs/02-stack.md) | Cada elección, justificada |
| [Arquitectura](./docs/03-arquitectura.md) | Capas, carpetas y flujo de datos |
| [Modelo de datos](./docs/04-modelo-de-datos.md) | Tablas y reglas |
| [Sistema de diseño](./docs/05-diseno-ui.md) | Color, tipografía, componentes |
| [Roadmap](./docs/06-roadmap.md) | 12 fases, todas terminadas |
| [Flujo de git](./docs/07-git-workflow.md) | Ramas, commits, versionado |
| [Seguridad](./docs/08-seguridad.md) | Repo público: qué nunca se commitea |
| [Decisiones](./docs/09-decisiones.md) | 18 ADRs |
| [Bitácora](./docs/BITACORA.md) | Diario de sesiones |

## Desarrollo

```bash
npm install
cp .env.example .env.local        # completar con valores propios
docker run -d --name nerd-postgres \
  -e POSTGRES_USER=nerd -e POSTGRES_PASSWORD=nerd_local_dev -e POSTGRES_DB=nerd \
  -p 5433:5432 -v nerd-pgdata:/var/lib/postgresql/data postgres:17-alpine
npm run db:migrate                # crea las tablas
npm run db:seed                   # catálogo de ejercicios
npm run dev                       # http://localhost:3000
```

| Comando | Qué hace |
|---|---|
| `npm run check` | Lint y formato (Biome) |
| `npm run typecheck` | TypeScript |
| `npm test` | 124 pruebas unitarias y de aislamiento |
| `npm run test:e2e` | 18 pruebas end-to-end (escritorio y móvil) |
| `npm run db:studio` | Explorar la base de datos |

> **Nota de seguridad:** este repositorio es público. Nunca se commitean credenciales ni datos personales. Ver [`docs/08-seguridad.md`](./docs/08-seguridad.md).

## Licencia

MIT — ver [LICENSE](./LICENSE).
