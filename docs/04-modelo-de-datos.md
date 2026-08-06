# 04 · Modelo de datos

PostgreSQL 17. Esquema definido en TypeScript con Drizzle (`src/db/schema/`), migraciones versionadas en `drizzle/`.

> **Regla global:** toda tabla de datos del usuario tiene `user_id` con `ON DELETE CASCADE`, y toda consulta filtra por él.

---

## Mapa general

```
users ─┬─ terms ── courses ─┬─ course_blocks
       │                    ├─ tasks ── subtasks
       │                    └─ attendance_records
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
| `timezone` | `text` | detectada del navegador al registrarse, editable |
| `week_starts_on` | `smallint` | 1 = lunes (por defecto), configurable |
| `visible_weekdays` | `smallint[]` NULL | días visibles en el horario; `NULL` = se deducen de los bloques |
| `theme` | `text` | `system` \| `light` \| `dark` |
| `weight_unit` | enum | `kg` \| `lb` — **solo afecta cómo se ve**, no cómo se guarda |
| `default_min_attendance_pct` | `numeric(5,2)` | 80.00 por defecto; cada materia puede sobrescribirlo |
| `excused_counts_as_present` | `boolean` | si las faltas justificadas cuentan como asistencia |
| `lates_per_absence` | `smallint` NULL | regla "N retardos = 1 falta"; `NULL` = los retardos no cuentan |
| `track_grades` | `boolean` | `false` — muestra u oculta las columnas de calificación |
| `available_equipment` | `text[]` NULL | filtra el catálogo de ejercicios; `NULL` = mostrar todo |
| `created_at` | `timestamptz` | |

Estas columnas son la implementación del principio de flexibilidad (ADR-012): **ningún comportamiento del que el usuario pueda tener una opinión está fijo en el código.**

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
| `min_attendance_pct` | `numeric(5,2)` NULL | `NULL` = usar el valor global del usuario |
| `expected_sessions_override` | `smallint` NULL | total de clases del semestre, si no se quiere estimar |
| `passing_grade` | `numeric(5,2)` NULL | *(dormido — módulo de calificaciones)* |
| `grade_scale` | `numeric(5,2)` NULL | escala máxima: 100, 10, 5… *(dormido)* |
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

### `attendance_records` — asistencia y faltas

Un registro por **sesión de clase**, no por día: si una materia se ve dos veces el mismo día, son dos registros.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `text` FK | cascade |
| `course_id` | `uuid` FK → courses | cascade |
| `block_id` | `uuid` FK → course_blocks NULL | `SET NULL`; NULL para materias sin horario fijo |
| `date` | `date` | día de la clase |
| `status` | enum | `present` \| `absent` \| `late` \| `excused` \| `cancelled` |
| `notes` | `text` NULL | motivo de la falta, por ejemplo |
| `created_at` | `timestamptz` | |

Único por `(course_id, date, block_id)` — una clase no puede registrarse dos veces.
Índice: `(user_id, course_id, date DESC)`.

**No existe el estado "sin registrar" como fila:** simplemente no hay registro. Asumir falta cuando el usuario olvidó marcar arruinaría sus números y sería injusto. Las sesiones sin registro quedan fuera del cálculo hasta que se llenen.

`cancelled` sale del denominador por completo: no cuenta ni a favor ni en contra.

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
| `grade` | `numeric(5,2)` NULL | calificación obtenida *(dormido)* |
| `grade_weight_pct` | `numeric(5,2)` NULL | cuánto pesa en la materia *(dormido)* |
| `created_at`, `updated_at` | `timestamptz` | |

Índices: `(user_id, status, due_at)` y `(user_id, course_id)`.

> **Por qué una sola tabla y no dos.** El usuario pidió que los pendientes generales estén "aparte". En la interfaz lo están: son secciones distintas. Pero por debajo son el mismo objeto — tienen título, fecha, prioridad y estado idénticos. Con dos tablas habría que duplicar toda la lógica y, peor, hacer `UNION` cada vez que la vista de "hoy" quiera mezclarlos. Con una tabla y un `WHERE`, ambas cosas salen gratis. *(Decisión registrada en `09-decisiones.md`.)*

### `subtasks` — pasos de una tarea

| Columna | Tipo |
|---|---|
| `id` `uuid` PK · `task_id` FK cascade · `title` `text` · `done` `boolean` · `sort_order` `integer` |

---

## Módulo de entrenamiento

### `exercises` — catálogo

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `text` FK NULL | **NULL = ejercicio precargado del sistema** |
| `name` | `text` | "Press de banca" |
| `muscle_group` | enum | `chest` `back` `legs` `shoulders` `arms` `core` `cardio` `full_body` |
| `equipment` | enum | `bodyweight` `dumbbell` `resistance_band` `kettlebell` `pullup_bar` `barbell` `machine` `cable` `other` |
| `tracking_type` | enum | `weight_reps` \| `reps_only` \| `time` \| `distance_time` |
| `allows_added_weight` | `boolean` | ejercicio de peso corporal al que se le puede añadir carga |
| `notes` | `text` NULL | |

Se precarga un catálogo de ~60 ejercicios en español (`db/seed.ts`): **~35 hacen falta solo peso corporal, mancuernas o bandas** — el caso principal del cliente, que entrena en casa — y el resto son de gimnasio. `tracking_type` permite registrar correctamente tanto sentadillas con barra como lagartijas, plancha o correr. El enum de equipo está ordenado de "no necesito nada" a "necesito un gimnasio".

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
| `weight_kg` | `numeric(6,2)` NULL | **siempre en kg**, sin importar la unidad que el usuario vea (ADR-011). **numeric, no float** — 22.5 kg debe ser exactamente 22.5 |
| `added_weight_kg` | `numeric(6,2)` NULL | carga extra en ejercicios de peso corporal (chaleco, mochila) |
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

### Entrenamiento

| Métrica | Fórmula |
|---|---|
| **Volumen de una serie (con peso)** | `reps × weight_kg` |
| **Volumen de una serie (peso corporal)** | `reps × (peso corporal + added_weight_kg)` si hay peso corporal registrado; si no, se cuentan repeticiones aparte |
| **Volumen semanal** | suma del volumen por semana (excluye calentamiento) |
| **1RM estimado** | Epley: `weight × (1 + reps / 30)` — solo para ejercicios con carga |
| **Progreso sin carga** | mejor serie en repeticiones y repeticiones totales por sesión |
| **Progreso por tiempo** | mejor duración sostenida |
| **Récord personal** | mejor marca por ejercicio según su `tracking_type` |
| **Tendencia** | últimas 4 semanas vs. las 4 previas |
| **Racha** | semanas consecutivas con al menos un entrenamiento |

### Asistencia

| Métrica | Fórmula |
|---|---|
| **Sesiones consideradas** | registros del periodo − `cancelled` |
| **Porcentaje actual** | `(present + excused*) / sesiones consideradas` — *`excused` cuenta según `excused_counts_as_present`* |
| **Faltas efectivas** | `absent + ⌊late / lates_per_absence⌋` si la regla está activa |
| **Sesiones totales estimadas** | `bloques semanales × semanas del semestre`, o `expected_sessions_override` |
| **Faltas máximas permitidas** | `⌊ sesiones totales × (1 − mínimo requerido) ⌋` |
| **Faltas restantes** | `faltas máximas − faltas efectivas` ← **la cifra que importa** |

---

## Reglas de integridad

1. `ON DELETE CASCADE` desde `users` en todo. Borrar cuenta = borrar todo.
2. `ON DELETE RESTRICT` en `exercise_id`: no se puede borrar un ejercicio con historial; se archiva.
3. `ON DELETE SET NULL` en `workouts.routine_id`: el historial sobrevive al borrado de la rutina.
4. Fechas siempre `timestamptz` (guardadas en UTC). Los horarios de clase usan `time` (hora local pura).
5. Pesos y RPE en `numeric`, nunca `float`.
6. Toda clave primaria es `uuid` — se puede generar en el cliente para escrituras optimistas.
7. **Toda masa se guarda en kilogramos.** La unidad del usuario es una preferencia de visualización, nunca un formato de almacenamiento (ADR-011).
8. **Columnas *dormidas*:** las de calificación (`tasks.grade`, `tasks.grade_weight_pct`, `courses.passing_grade`, `courses.grade_scale`) existen desde la primera migración pero no tienen interfaz. Se activan con `users.track_grades`. El cliente no quiere calificaciones hoy, pero pidió dejarlo abierto — así queda abierto sin costo ni migración futura (ADR-013).

## Convenciones

- Tablas y columnas en `snake_case` e inglés; en TypeScript quedan como `camelCase`.
- Toda tabla lleva `created_at`; las editables llevan también `updated_at`.
- Los `enum` se declaran como tipos enumerados de Postgres, no como texto libre.
