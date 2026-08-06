# Bitácora del proyecto

> Diario de sesiones. **Se lee al inicio de cada sesión y se actualiza al final, sin excepción.**
> Lo más reciente arriba.

---

## Estado actual

| | |
|---|---|
| **Fase** | ✅ **Todas (0–11) terminadas** |
| **Rama actual** | `feat/foundation` (contiene las fases 1–11) |
| **Versión** | 1.0.0 |
| **Repositorio** | `github.com/AsuraBeliever/nerd` — **público** |
| **Producción** | No desplegada todavía — falta que el cliente cree las cuentas |
| **Pruebas** | 124 unitarias + 18 end-to-end (escritorio y móvil), todas en verde |
| **Siguiente paso** | Cliente crea Neon, Google Cloud OAuth y Vercel → primer despliegue |

### Lo que falta para producción (requiere al cliente)
1. **Neon** — crear base de datos y darme la cadena de conexión.
2. **Google Cloud Console** — crear el ID y el secreto de OAuth.
3. **Vercel** — conectar el repositorio.

Al activar Google se borra `DEV_LOGIN` del entorno y el acceso de desarrollo deja de existir.

### Ramas estacionadas
Ninguna.

### Bloqueado esperando al usuario
Nada por ahora. En la **Fase 1** necesitaré que él cree tres cuentas (Neon, Google Cloud OAuth, Vercel) — le daré los pasos exactos cuando lleguemos ahí.

---

## Sesiones

### 2026-08-06 · Sesión 4 — Fases 1 a 11, la app completa
**Rama:** `feat/foundation` · **Estado:** ✅ completada

El cliente pidió no parar hasta terminar todas las fases, con páginas dedicadas por módulo. Se construyó todo de corrido, verificando cada fase antes de pasar a la siguiente.

**Lo construido, por fase**

| Fase | Qué quedó |
|---|---|
| 1 · Cuenta y esqueleto | 16 tablas, Auth.js con sesiones en base de datos, `requireUser`, layout con barra lateral y barra inferior |
| 2 · Horario | Semestres, materias, bloques, detección de traslapes, cuadrícula semanal y vista por día |
| 3 · Asistencia | Registro de un toque, faltas restantes, semáforo, reglas configurables |
| 4 y 5 · Tareas y pendientes | Una tabla, dos secciones; agrupación por urgencia; subtareas |
| 6 · Hoy | Todo el día en un solo viaje al servidor |
| 7 · Ajustes | Todas las preferencias + exportar datos |
| 8, 9 y 10 · Entrenamiento | Catálogo, rutinas, registro de sesión y progreso por tipo de ejercicio |
| 11 · PWA y pulido | Manifiesto, service worker, páginas de error, pruebas E2E |

**Decisiones nuevas** — ADR-015 a ADR-018: Postgres local en Docker (puerto 5433 para no chocar con el contenedor que el cliente ya tenía), acceso de desarrollo mientras no hay OAuth, componentes propios sobre HTML nativo, y menos librerías de las planeadas (sin TanStack Query, sin Recharts, sin Serwist, sin React Hook Form).

**Bugs encontrados por las pruebas, no por casualidad**
1. **Faltas máximas con flotantes**: `30 × (1 − 90/100)` daba 2.9999999999999996 y le quitaba una falta al usuario. Ahora se calcula con enteros.
2. **Semáforo de asistencia injusto**: se basaba en el porcentaje del momento, así que marcaba rojo a quien faltó 4 de 14 clases aunque todavía pudiera terminar el semestre al 87%. Ahora manda cuántas faltas quedan.
3. **Fechas de entrega en la zona equivocada**: se interpretaban en la zona del servidor, así que una entrega a las 11:30 pm podía caer al día siguiente y moverse sola al editarla.
4. **Desmarcar asistencia guardaba "cancelada"** en vez de borrar el registro, que significa otra cosa en el cálculo.

**Qué falta / siguiente paso**
- Las tres cuentas del cliente para desplegar a producción.
- Backlog: notificaciones, calificaciones (la base de datos ya está lista), importar horario desde PDF, escritura sin conexión.

---

### 2026-08-05 · Fase 0 — Cimientos
**Rama:** `chore/scaffold` · **Estado:** 🚧 esperando revisión del cliente en local

**Qué se montó**
- Next.js **16.3** + React 19 + TypeScript estricto (`noUncheckedIndexedAccess`, `noImplicitOverride`, sin `any`).
- Tailwind CSS v4 con el sistema de diseño de `05-diseno-ui.md` traducido a tokens: neutros, un acento, 3 semánticos y las 8 materias, en claro y oscuro.
- Biome (lint + formato), Vitest (4 pruebas pasando), Playwright (2 pruebas de humo, escritorio y móvil).
- Estructura de carpetas de `03-arquitectura.md`.
- `.env.example` con valores falsos · CI en GitHub Actions (lint, tipos, tests, build, audit).
- Página provisional que muestra el sistema de diseño funcionando.

**Verificado**
`npm run check:ci` ✅ · `npm run typecheck` ✅ · `npm test` 4/4 ✅ · `npm run build` ✅ · `localhost:3000` responde 200 en 31 ms.

**Decisiones de la fase**
- **Next.js 16, no 15.** El plan decía 15; la estable al momento de montar es la 16.3. Trae cambios que rompen respecto a la 15 → se anotó en `CLAUDE.md` §10 que la referencia es `node_modules/next/dist/docs/`, no la memoria. Docs actualizadas.
- `next dev` añade solo un bloque de instrucciones al final de `CLAUDE.md`. Se desactivó con `agentRules: false`: ese archivo es el contrato con el cliente, no un generado. La advertencia útil se conservó, escrita a mano.
- `globals.css` se excluye de Biome: su parser de CSS todavía no entiende las at-rules de Tailwind v4 (`@theme`, `@custom-variant`). El build de Tailwind sí lo valida.
- Se borraron los SVG de ejemplo de create-next-app.

**Qué falta / siguiente paso**
- Revisión del cliente en `localhost:3000` → merge a `main`.
- Fase 1 (`feat/auth-google`): Neon, Drizzle, Auth.js con Google y primer despliegue a producción. Ahí le pido al cliente las tres cuentas.

---

### 2026-08-05 · Sesión 3 — Defaults del cliente y arranque de la Fase 0
**Rama:** `docs/attendance-and-preferences` → `main` · **Estado:** ✅ completada

**Aprobación del cliente:** revisó y aprobó la rama de la sesión 2. Se integró a `main` con `--no-ff`.

**Respuestas que se convirtieron en valores por defecto (nunca en constantes)**

| Lo que dijo | Default | Configurable |
|---|---|---|
| "Las justificaciones sí cuentan como asistencias" | `excused_counts_as_present = true` | ✅ |
| "No existen retardos, o tienes asistencia o no" | `track_lates = false` — el botón "Tarde" ni aparece | ✅ |
| "En casa puro cuerpo, ejercicios básicos" | `available_equipment = ['bodyweight']` | ✅ |

Reiteró la regla: *"déjalo libre para que cada quien lo pueda configurar a su manera, **siempre mantén en mente esa regla**"*. Se elevó a **sección 0 de `CLAUDE.md`**, arriba de todo lo demás, con la pregunta que debo hacerme antes de escribir cualquier condicional: *¿otra persona podría querer esto distinto?*

Corolario nuevo de interfaz: cuando el usuario apaga una opción, **la interfaz se encoge**; no se queda con botones grises estorbando.

**Qué falta / siguiente paso**
- Fase 0 (`chore/scaffold`): montar el proyecto Next.js con todo el tooling.

---

### 2026-08-05 · Sesión 2 — Asistencia, flexibilidad y repo público
**Rama:** `docs/attendance-and-preferences` · **Estado:** ✅ completada

**Retroalimentación del cliente y qué cambió**

| Lo que dijo | Qué se hizo |
|---|---|
| "Solo hago cosas desde casa" | El módulo se replanteó: **entrenamiento en casa como caso principal**. El progreso ahora se mide según el tipo de ejercicio — repeticiones y tiempo donde no hay carga, no solo kilos. Se renombró `gimnasio` → `entrenamiento` en todo el proyecto. |
| "Que el usuario pueda elegir entre kilos o libras" | Preferencia `weight_unit`. Todo se guarda en kg y se convierte solo al mostrar (ADR-011). |
| "Mi horario es fijo, no tengo clases los sábados, **pero eso no importa**, quiero que sea flexible" | ADR-012: nada codificado a la medida del cliente. Los 7 días valen igual, inicio de semana, días visibles, umbrales, unidades — todo configurable. Nueva **Fase 7 (Ajustes)**. |
| "No me interesa registrar calificaciones, pero déjalo abierto" | Columnas **dormidas** desde la primera migración, sin interfaz, activables con `track_grades` (ADR-013). Abierto de verdad, sin costo hoy ni migración mañana. |
| "Sí me interesa registrar faltas y poner el mínimo de asistencia, en mi caso 80%, pero déjalo a libre elección" | **Módulo nuevo completo:** tabla `attendance_records`, umbral configurable global y por materia, reglas de justificadas y retardos, y el cálculo de **faltas restantes** como cifra principal. Nueva **Fase 3**. |
| "El repo va a ser público, ten cuidado con lo que publicas" | Nuevo `docs/08-seguridad.md` (ADR-014). Se eliminó el correo del cliente de `CLAUDE.md` y **se reescribió el commit inicial** antes de abrir el repo. Secret scanning y push protection activados. |

**Otros cambios**
- Roadmap pasó de 10 a 12 fases (0–11) por asistencia y ajustes.
- Nueva ficha `docs/features/asistencia.md`; `gimnasio.md` → `entrenamiento.md`.
- Se agregó `LICENSE` (MIT, a nombre de `AsuraBeliever` para no publicar el nombre legal).
- Repositorio creado en GitHub.

**Qué falta / siguiente paso**
- Arrancar la Fase 0 (`chore/scaffold`).
- Preguntas abiertas: si las justificadas cuentan como asistencia, si aplica "3 retardos = 1 falta", y qué equipo tiene en casa para precargar el catálogo correcto.

### 2026-08-05 · Sesión 1 — Planeación inicial
**Rama:** `main` · **Estado:** ✅ completada

**Qué se hizo**
- Se definió el contrato de trabajo cliente/developer en `CLAUDE.md`.
- Se levantaron los requerimientos con el usuario. Sus respuestas:
  - Dispositivos: **móvil y escritorio por igual** → responsive completo desde el inicio.
  - Usuarios: **multiusuario con login de Google**.
  - Hosting: **Vercel + Neon (Postgres gratuito)**.
  - Alcance v1: **las cinco funcionalidades completas** (horario, tareas/exámenes, pendientes, gimnasio, dashboard). Textual: *"Todo. Muéstrame tu mejor trabajo."*
  - Diseño: **minimalista**.
- Se eligió el stack completo y se justificó pieza por pieza (`docs/02-stack.md`).
- Se diseñó el modelo de datos completo, incluidas las métricas del gimnasio (`docs/04-modelo-de-datos.md`).
- Se definió la arquitectura de tres capas y la estructura de carpetas (`docs/03-arquitectura.md`).
- Se definió el sistema de diseño minimalista (`docs/05-diseno-ui.md`).
- Se planeó el roadmap en 10 fases, una rama por fase (`docs/06-roadmap.md`).
- Se documentó el flujo de git: local → aprobación del usuario → producción (`docs/07-git-workflow.md`).
- Se registraron 10 decisiones técnicas (`docs/09-decisiones.md`).
- Se escribieron las fichas de las cinco funcionalidades (`docs/features/`).
- Se inicializó el repositorio de git.

**Decisiones destacadas**
- Una sola tabla `tasks` para lo académico y lo personal, separadas en la interfaz (ADR-004). Ahorra duplicar toda la lógica y hace casi gratis la Fase 4.
- Las métricas del gimnasio se calculan, nunca se guardan (ADR-006). Evita datos inconsistentes al editar el historial.
- Se despliega a producción desde la Fase 1, no al final (ADR-010).

**Qué falta / siguiente paso**
- Crear la rama `chore/scaffold` y montar el proyecto Next.js con todo el tooling.
- Antes de la Fase 2, contestar las preguntas abiertas al final de `docs/features/horario.md`.

---

<!-- Plantilla de entrada

### AAAA-MM-DD · Sesión N — Título
**Rama:** `nombre` · **Estado:** ✅ completada | 🚧 en progreso | ⏸ estacionada

**Qué se hizo**
-

**Decisiones destacadas**
-

**Qué falta / siguiente paso**
-
-->
