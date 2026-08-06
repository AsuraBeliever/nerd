# Bitácora del proyecto

> Diario de sesiones. **Se lee al inicio de cada sesión y se actualiza al final, sin excepción.**
> Lo más reciente arriba.

---

## Estado actual

| | |
|---|---|
| **Fase** | 0 — Cimientos (aún no iniciada) |
| **Rama actual** | `docs/attendance-and-preferences` |
| **Versión** | 0.0.1 |
| **Repositorio** | `github.com/AsuraBeliever/nerd` — **público** |
| **Producción** | No desplegada todavía |
| **Siguiente paso** | Rama `chore/scaffold`: crear el proyecto Next.js con todo el tooling |

### Ramas estacionadas
Ninguna.

### Bloqueado esperando al usuario
Nada por ahora. En la **Fase 1** necesitaré que él cree tres cuentas (Neon, Google Cloud OAuth, Vercel) — le daré los pasos exactos cuando lleguemos ahí.

---

## Sesiones

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
