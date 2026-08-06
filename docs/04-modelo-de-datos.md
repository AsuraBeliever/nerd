# 04 · Modelo de datos

PostgreSQL 17. Esquema definido en TypeScript con Drizzle (`src/db/schema/`), migraciones versionadas en `drizzle/`.

> **Regla global:** toda tabla de datos del usuario tiene `user_id` con `ON DELETE CASCADE`, y toda consulta filtra por él.

---

## Mapa general

```
users ─┬─ terms ── courses ─┬─ course_blocks
       │                    └─ tasks ── subtasks
       ├─ tasks (course_id NULL = pendiente personal)
       ├─ exercises
       ├─ routines ── routine_exercises ── exercises
       ├─ workouts ── workout_sets ── exercises
       └─ body_metrics
```

---

## Autenticación (Auth.js + adaptador Drizzle)

Tablas estándar, creadas por el adaptador: **`users`**, **`accounts`**, **`sessions`**, **`verification_tokens`**.

`users` se extiende con columnas propias:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | UUID |
| `name`, `email`, `image` | `text` | de Google |
| `timezone` | `text` | por defecto `America/Mexico_City` |
| `week_starts_on` | `smallint` | 1 = lunes (por defecto) |
| `theme` | `text` | `system` \| `light` \| `dark` |
| `created_at` | `timestamptz` | |

---

## Módulo académico

### `terms` — semestres/cuatrimestres

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `text` FK → users | cascade |
| `name` | `text` | "2026-2", "Otoño 2026" |
| `start_date`, `end_date` | `date` | |
| `is_active` | `boolean` | solo uno activo por usuario |

*Por qué existe:* sin periodos, el horario del semestre pasado contamina el actual. Con esto, cambiar de semestre archiva todo de golpe sin borrar el historial.

### `courses` — materias

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `text` FK | cascade |
| `term_id` | `uuid` FK → terms | cascade |
| `name` | `text` | "Cálculo Diferencial" |
| `code` | `text` NULL | clave de la materia |
| `teacher` | `text` NULL | |
| `room` | `text` NULL | salón por defecto |
| `color` | `text` | token de la paleta (ver `05-diseno-ui.md`) |
| `credits` | `smallint` NULL | |
| `archived_at` | `timestamptz` NULL | |

Índices: `(user_id, term_id)`.

### `course_blocks` — bloques de clase

Una materia puede tener varias sesiones semanales (lunes 7–9, miércoles 7–9). Cada una es un bloque.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `course_id` | `uuid` FK → courses | cascade |
| `user_id` | `text` FK | denormalizado, para filtrar sin JOIN |
| `weekday` | `smallint` | 1 = lunes … 7 = domingo (ISO-8601) |
| `start_time` | `time` | hora local, sin fecha |
| `end_time` | `time` | |
| `room` | `text` NULL | si difiere del salón de la materia |

Restricciones: `end_time > start_time`; `weekday` entre 1 y 7. Índice: `(user_id, weekday, start_time)`.

*Decisión:* `time` sin zona horaria — un bloque de clase es "los lunes a las 7:00" en la vida real, no un instante absoluto. El traslape de horarios se valida en la aplicación (`features/schedule/lib.ts`), donde se puede dar un mensaje útil.

---

## Módulo de tareas

### `tasks` — tareas académicas **y** pendientes personales

Una sola tabla para ambos. `course_id = NULL` significa pendiente personal.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `text` FK | cascade |
| `course_id` | `uuid` FK → courses NULL | **NULL = pendiente general** |
| `title` | `text` | |
| `notes` | `text` NULL | admite markdown |
| `type` | enum | `homework` \| `exam` \| `project` \| `reading` \| `personal` \| `other` |
| `due_at` | `timestamptz` NULL | |
| `has_time` | `boolean` | si es false, se muestra solo la fecha |
| `priority` | enum | `low` \| `medium` \| `high` |
| `status` | enum | `todo` \| `doing` \| `done` |
| `completed_at` | `timestamptz` NULL | |
| `sort_order` | `integer` | orden manual en la lista |
| `created_at`, `updated_at` | `timestamptz` | |

Índices: `(user_id, status, due_at)` y `(user_id, course_id)`.

> **Por qué una sola tabla y no dos.** El usuario pidió que los pendientes generales estén "aparte". En la interfaz lo están: son secciones distintas. Pero por debajo son el mismo objeto — tienen título, fecha, prioridad y estado idénticos. Con dos tablas habría que duplicar toda la lógica y, peor, hacer `UNION` cada vez que la vista de "hoy" quiera mezclarlos. Con una tabla y un `WHERE`, ambas cosas salen gratis. *(Decisión registrada en `09-decisiones.md`.)*

### `subtasks` — pasos de una tarea

| Columna | Tipo |
|---|---|
| `id` `uuid` PK · `task_id` FK cascade · `title` `text` · `done` `boolean` · `sort_order` `integer` |

---

## Módulo de gimnasio

### `exercises` — catálogo

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `text` FK NULL | **NULL = ejercicio precargado del sistema** |
| `name` | `text` | "Press de banca" |
| `muscle_group` | enum | `chest` `back` `legs` `shoulders` `arms` `core` `cardio` `full_body` |
| `equipment` | enum | `barbell` `dumbbell` `machine` `cable` `bodyweight` `other` |
| `tracking_type` | enum | `weight_reps` \| `reps_only` \| `time` \| `distance_time` |
| `notes` | `text` NULL | |

Se precarga un catálogo de ~60 ejercicios comunes en español (`db/seed.ts`) para que el usuario no empiece con la pantalla vacía. `tracking_type` permite registrar correctamente tanto sentadillas como plancha o correr.

### `routines` — plantillas de entrenamiento

| Columna | Tipo | Notas |
|---|---|---|
| `id` `uuid` PK · `user_id` FK · `name` `text` · `description` `text` NULL · `is_active` `boolean` · `archived_at` NULL |

### `routine_exercises` — ejercicios dentro de una rutina

| Columna | Tipo | Notas |
|---|---|---|
| `routine_id` | FK cascade | |
| `exercise_id` | FK restrict | |
| `sort_order` | `integer` | |
| `target_sets` | `smallint` | series planeadas |
| `target_reps_min` / `target_reps_max` | `smallint` | rango, ej. 8–12 |
| `target_weight` | `numeric(6,2)` NULL | |
| `rest_seconds` | `smallint` NULL | |

### `workouts` — sesión realizada

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `text` FK | |
| `routine_id` | `uuid` FK NULL | `SET NULL` — borrar la rutina no borra el historial |
| `started_at` | `timestamptz` | |
| `ended_at` | `timestamptz` NULL | NULL = sesión en curso |
| `notes` | `text` NULL | |
| `perceived_effort` | `smallint` NULL | 1–10, cómo se sintió |

Índice: `(user_id, started_at DESC)`.

### `workout_sets` — cada serie levantada

Es la tabla más importante del módulo: de aquí sale **todo** el progreso.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `workout_id` | `uuid` FK cascade | |
| `exercise_id` | `uuid` FK restrict | |
| `user_id` | `text` FK | denormalizado, para agregados rápidos |
| `set_number` | `smallint` | |
| `reps` | `smallint` NULL | |
| `weight_kg` | `numeric(6,2)` NULL | **numeric, no float** — 22.5 kg debe ser exactamente 22.5 |
| `duration_seconds` | `integer` NULL | para plancha, cardio |
| `distance_m` | `integer` NULL | |
| `rpe` | `numeric(3,1)` NULL | esfuerzo percibido 1–10 |
| `is_warmup` | `boolean` | las series de calentamiento no cuentan en las estadísticas |
| `completed_at` | `timestamptz` | |

Índice: `(user_id, exercise_id, completed_at DESC)` — es el que hace instantánea la gráfica de progreso por ejercicio.

### `body_metrics` — peso corporal y medidas

| Columna | Tipo |
|---|---|
| `id` `uuid` PK · `user_id` FK · `date` `date` · `weight_kg` `numeric(5,2)` NULL · `body_fat_pct` `numeric(4,1)` NULL · `notes` `text` NULL |

Único por `(user_id, date)`.

---

## Métricas derivadas (calculadas, no almacenadas)

Nada de esto se guarda: se calcula en SQL desde `workout_sets`. Guardar agregados es garantía de datos inconsistentes.

| Métrica | Fórmula |
|---|---|
| **Volumen de una serie** | `reps × weight_kg` |
| **Volumen semanal** | suma del volumen por semana (excluye calentamiento) |
| **1RM estimado** | Epley: `weight × (1 + reps / 30)` |
| **Récord personal** | mayor peso a ≥1 rep, y mayor 1RM estimado, por ejercicio |
| **Tendencia** | comparación del mejor 1RM estimado de las últimas 4 semanas vs. las 4 previas |
| **Racha** | semanas consecutivas con al menos un entrenamiento |

---

## Reglas de integridad

1. `ON DELETE CASCADE` desde `users` en todo. Borrar cuenta = borrar todo.
2. `ON DELETE RESTRICT` en `exercise_id`: no se puede borrar un ejercicio con historial; se archiva.
3. `ON DELETE SET NULL` en `workouts.routine_id`: el historial sobrevive al borrado de la rutina.
4. Fechas siempre `timestamptz` (guardadas en UTC). Los horarios de clase usan `time` (hora local pura).
5. Pesos y RPE en `numeric`, nunca `float`.
6. Toda clave primaria es `uuid` — se puede generar en el cliente para escrituras optimistas.

## Convenciones

- Tablas y columnas en `snake_case` e inglés; en TypeScript quedan como `camelCase`.
- Toda tabla lleva `created_at`; las editables llevan también `updated_at`.
- Los `enum` se declaran como tipos enumerados de Postgres, no como texto libre.
