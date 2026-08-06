# 09 · Registro de decisiones técnicas (ADR)

Cada decisión no obvia queda aquí, con su contexto y sus consecuencias. Si en seis meses alguien (yo incluido) se pregunta "¿por qué está hecho así?", la respuesta está en este archivo.

Formato: contexto → decisión → alternativas → consecuencias.

---

## ADR-001 · Next.js full-stack en vez de frontend + API separada
**5 ago 2026 · Aceptada**

**Contexto.** Un desarrollador, proyecto personal de largo plazo, hosting gratuito.
**Decisión.** Next.js 15 con App Router: Server Components para lecturas y Server Actions para escrituras.
**Alternativas.** SPA + API REST/tRPC separada; Remix; SvelteKit.
**Consecuencias.** ➕ Un solo despliegue, un solo repo, tipos compartidos de extremo a extremo, sin capa de API que mantener. ➖ Acoplamiento a Next.js; migrar después implicaría reescribir la capa de datos (riesgo aceptado: es una app personal, no un producto multiplataforma).

---

## ADR-002 · PostgreSQL en Neon, no Supabase
**5 ago 2026 · Aceptada**

**Contexto.** Se necesita Postgres gestionado y gratuito. Supabase es la opción popular.
**Decisión.** Neon, usado solo como base de datos.
**Alternativas.** Supabase; Turso/SQLite; Postgres autoalojado.
**Consecuencias.** ➕ Solo se adopta lo que se necesita — Auth.js ya cubre autenticación, y no se requiere storage ni realtime. ➕ Las *ramas de base de datos* de Neon encajan con el flujo de una rama por funcionalidad. ➖ Hay que implementar autenticación en vez de recibirla hecha (bajo costo con Auth.js y a cambio de control total).

---

## ADR-003 · Drizzle en vez de Prisma
**5 ago 2026 · Aceptada**

**Contexto.** Hace falta un ORM con buenos tipos y migraciones, en entorno serverless.
**Decisión.** Drizzle ORM + Drizzle Kit.
**Alternativas.** Prisma; Kysely; SQL a mano.
**Consecuencias.** ➕ Sin motor binario → arranques en frío rápidos en Vercel. ➕ SQL predecible y legible, importante para los agregados del gimnasio. ➖ Ecosistema y documentación menores que Prisma; menos herramientas visuales.

---

## ADR-004 · Una sola tabla `tasks` para lo académico y lo personal
**5 ago 2026 · Aceptada**

**Contexto.** El usuario pidió tareas ligadas a materias **y**, "aparte", una lista de pendientes generales.
**Decisión.** Una tabla `tasks` con `course_id` que admite `NULL`. `NULL` = pendiente personal. La separación es de interfaz, no de base de datos.
**Alternativas.** Dos tablas independientes; herencia de tablas de Postgres.
**Consecuencias.** ➕ Toda la lógica (crear, editar, completar, ordenar, fechas, prioridad) se escribe una vez. ➕ La vista "hoy" mezcla ambos con un solo `SELECT`, sin `UNION`. ➕ La Fase 4 se vuelve casi gratis. ➖ Hay que recordar filtrar por `course_id IS NULL` / `IS NOT NULL` en cada vista — se encapsula en `features/tasks/queries.ts` para que no se olvide.

---

## ADR-005 · `time` sin zona horaria para los bloques de clase
**5 ago 2026 · Aceptada**

**Contexto.** Un bloque de clase es "los lunes de 7:00 a 9:00", no un instante concreto.
**Decisión.** `weekday` (1–7, ISO) + `start_time`/`end_time` de tipo `time`. Las fechas reales (entregas, entrenamientos) sí usan `timestamptz` en UTC.
**Alternativas.** Guardar eventos concretos por semana; usar RRULE de iCalendar.
**Consecuencias.** ➕ Simple, sin explosión de filas, inmune a cambios de horario de verano. ➖ No modela excepciones ("esta semana la clase se movió"): se agregará como tabla de excepciones si el usuario lo necesita.

---

## ADR-006 · Métricas del gimnasio calculadas, nunca almacenadas
**5 ago 2026 · Aceptada**

**Contexto.** 1RM estimado, volumen semanal, récords y rachas podrían guardarse precalculados.
**Decisión.** Se calculan en SQL desde `workout_sets` en cada consulta.
**Alternativas.** Columnas derivadas; tabla de agregados; vistas materializadas.
**Consecuencias.** ➕ Imposible que se desincronicen al editar una serie vieja. ➕ Cambiar la fórmula de 1RM no requiere recalcular historial. ➖ Consultas más costosas — mitigado con el índice `(user_id, exercise_id, completed_at DESC)`. Si algún día hay decenas de miles de series, se evaluará una vista materializada.

---

## ADR-007 · `numeric` para pesos, nunca `float`
**5 ago 2026 · Aceptada**

**Contexto.** Los pesos del gimnasio llevan decimales (22.5 kg, 2.5 kg de incremento).
**Decisión.** `numeric(6,2)` en Postgres; en TypeScript se manejan como string y se convierten explícitamente.
**Consecuencias.** ➕ Un récord personal nunca aparecerá como `100.00000000000001`. ➖ Requiere conversión explícita al calcular — se centraliza en `features/workouts/lib.ts`.

---

## ADR-008 · Multiusuario desde el día uno
**5 ago 2026 · Aceptada**

**Contexto.** La app la usará principalmente una persona, pero el usuario pidió cuentas separadas con login de Google.
**Decisión.** `user_id` en toda tabla, `requireUser()` obligatorio, verificación de propiedad en toda escritura, desde la primera migración.
**Alternativas.** Empezar mono-usuario y migrar después.
**Consecuencias.** ➕ Se evita una migración dolorosa y una clase entera de fugas de datos entre cuentas. ➖ Un poco más de código en cada consulta — el precio correcto por no filtrar los datos de un usuario a otro.

---

## ADR-009 · Biome en lugar de ESLint + Prettier
**5 ago 2026 · Aceptada**

**Contexto.** Se necesita linting y formato consistentes.
**Decisión.** Biome como herramienta única.
**Consecuencias.** ➕ Una configuración en vez de dos, ejecución en milisegundos, sin conflictos entre linter y formateador. ➖ Algunos plugins específicos de ESLint no tienen equivalente (ninguno indispensable aquí).

---

## ADR-010 · Producción desde la Fase 1
**5 ago 2026 · Aceptada**

**Contexto.** Se podría desarrollar todo en local y desplegar al final.
**Decisión.** Se despliega a producción en cuanto exista el login, y cada fase posterior llega a producción tras la aprobación del usuario.
**Consecuencias.** ➕ El usuario usa la app de verdad desde temprano y da retroalimentación sobre software real, no sobre maquetas. ➕ No hay un "gran deploy" riesgoso al final. ➖ Obliga a que cada fase quede realmente terminada antes de pasar a la siguiente — que es precisamente lo que se busca.

---

<!-- Plantilla para nuevas decisiones

## ADR-0NN · Título
**Fecha · Aceptada | Reemplazada por ADR-0MM**

**Contexto.**
**Decisión.**
**Alternativas.**
**Consecuencias.** ➕ … ➖ …
-->
