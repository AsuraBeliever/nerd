# Bitácora del proyecto

> Diario de sesiones. **Se lee al inicio de cada sesión y se actualiza al final, sin excepción.**
> Lo más reciente arriba.

---

## Estado actual

| | |
|---|---|
| **Fase** | 0 — Cimientos (aún no iniciada) |
| **Rama actual** | `main` |
| **Versión** | 0.0.1 |
| **Producción** | No desplegada todavía |
| **Siguiente paso** | Rama `chore/scaffold`: crear el proyecto Next.js con todo el tooling |

### Ramas estacionadas
Ninguna.

### Bloqueado esperando al usuario
Nada por ahora. En la **Fase 1** necesitaré que él cree tres cuentas (Neon, Google Cloud OAuth, Vercel) — le daré los pasos exactos cuando lleguemos ahí.

---

## Sesiones

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
