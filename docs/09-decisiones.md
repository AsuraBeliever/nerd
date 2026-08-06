# 09 · Registro de decisiones técnicas (ADR)

Cada decisión no obvia queda aquí, con su contexto y sus consecuencias. Si en seis meses alguien (yo incluido) se pregunta "¿por qué está hecho así?", la respuesta está en este archivo.

Formato: contexto → decisión → alternativas → consecuencias.

---

## ADR-001 · Next.js full-stack en vez de frontend + API separada
**5 ago 2026 · Aceptada**

**Contexto.** Un desarrollador, proyecto personal de largo plazo, hosting gratuito.
**Decisión.** Next.js 16 con App Router: Server Components para lecturas y Server Actions para escrituras.
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
**Consecuencias.** ➕ Sin motor binario → arranques en frío rápidos en Vercel. ➕ SQL predecible y legible, importante para los agregados del entrenamiento. ➖ Ecosistema y documentación menores que Prisma; menos herramientas visuales.

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

## ADR-006 · Métricas de entrenamiento calculadas, nunca almacenadas
**5 ago 2026 · Aceptada**

**Contexto.** 1RM estimado, volumen semanal, récords y rachas podrían guardarse precalculados.
**Decisión.** Se calculan en SQL desde `workout_sets` en cada consulta.
**Alternativas.** Columnas derivadas; tabla de agregados; vistas materializadas.
**Consecuencias.** ➕ Imposible que se desincronicen al editar una serie vieja. ➕ Cambiar la fórmula de 1RM no requiere recalcular historial. ➖ Consultas más costosas — mitigado con el índice `(user_id, exercise_id, completed_at DESC)`. Si algún día hay decenas de miles de series, se evaluará una vista materializada.

---

## ADR-007 · `numeric` para pesos, nunca `float`
**5 ago 2026 · Aceptada**

**Contexto.** Los pesos del entrenamiento llevan decimales (22.5 kg, 2.5 kg de incremento).
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

## ADR-011 · Toda masa se guarda en kilogramos; la unidad es solo visual
**5 ago 2026 · Aceptada**

**Contexto.** El usuario pidió que se pueda elegir entre kilos y libras.
**Decisión.** La base de datos guarda **siempre kilogramos** (`weight_kg`). La preferencia `users.weight_unit` solo afecta cómo se muestran y se capturan los valores; la conversión ocurre en la frontera de la interfaz.
**Alternativas.** Guardar en la unidad capturada junto con un campo de unidad; guardar ambas.
**Consecuencias.** ➕ Cambiar de unidad a media historia no rompe ninguna gráfica ni récord: son los mismos datos vistos de otro modo. ➕ Todos los agregados en SQL suman una sola escala, sin convertir por fila. ➖ Hay que convertir en cada entrada y salida — se centraliza en `features/training/units.ts` y se cubre con pruebas de ida y vuelta. ➖ Redondeo visible en libras (2.5 kg → 5.51 lb): se resuelve con incrementos propios de cada unidad (2.5 kg / 5 lb) en vez de convertir el paso.

---

## ADR-012 · Configurable por el usuario, no codificado a la medida del cliente
**5 ago 2026 · Aceptada**

**Contexto.** Petición explícita del cliente: *"yo quiero que sea flexible y que el usuario pueda ponerlo como a él le convenga mejor, no solo como a mí me sirve ahorita, porque puede cambiar en un futuro."*
**Decisión.** Ningún comportamiento del que un usuario pueda tener una opinión se fija en el código. Concretamente: los 7 días de la semana se soportan por igual (nada de asumir lunes a viernes), el inicio de semana, la zona horaria, el umbral mínimo de asistencia (global y por materia), cómo cuentan las justificadas y los retardos, la unidad de peso, el equipo de entrenamiento disponible, el tema, y los días visibles del horario.
**Alternativas.** Codificar los valores del cliente y hacerlos configurables después.
**Consecuencias.** ➕ La app sirve a otra persona con costumbres distintas sin tocar el código — y al propio cliente cuando cambie de escuela, de horario o de gimnasio. ➕ Evita la clase de suposición que envenena un producto ("aquí nadie tiene clases en sábado"). ➖ Más columnas de preferencias y más ramas en la lógica; el costo real está en la interfaz de Ajustes, que por eso tiene su propia fase (Fase 7). ➖ Toda función que dependa de una preferencia debe recibirla como parámetro, nunca leerla de una constante — es la regla que hace que esto se sostenga.

---

## ADR-013 · Calificaciones: columnas dormidas desde el día uno
**5 ago 2026 · Aceptada**

**Contexto.** El cliente dijo que no le interesan las calificaciones, *"pero déjalo abierto en caso de que alguien quiera o yo mismo cambie de opinión"*.
**Decisión.** Las columnas (`tasks.grade`, `tasks.grade_weight_pct`, `courses.passing_grade`, `courses.grade_scale`) se crean desde la primera migración, pero **sin interfaz**. Se activan con el interruptor `users.track_grades`, que por defecto está apagado.
**Alternativas.** No crearlas y agregarlas después con una migración; construir el módulo completo ahora.
**Consecuencias.** ➕ "Dejarlo abierto" queda resuelto de verdad: activarlo después es escribir pantallas, no migrar datos de producción. ➕ Cero ruido visual para quien no las quiere. ➖ Cuatro columnas nulas sin uso — costo despreciable en Postgres. ➖ Hay que resistir la tentación de mostrarlas "porque ya están": no se activan hasta que el cliente las pida.

---

## ADR-014 · Repositorio público
**5 ago 2026 · Aceptada**

**Contexto.** Decisión del cliente durante la sesión 2: el repositorio será público.
**Decisión.** Se hace público, con reglas escritas sobre qué nunca se commitea (`08-seguridad.md`) y con secret scanning y push protection activados en GitHub.
**Consecuencias.** ➕ El código es auditable y sirve de portafolio. ➕ Ninguna protección real depende de que el código esté oculto: la seguridad descansa en el *client secret* de OAuth, el `AUTH_SECRET` y el aislamiento por `user_id`, no en el secreto del código. ➖ Un secreto commiteado por error se considera comprometido de inmediato, aunque se borre el commit — de ahí la regla de rotar primero y limpiar el historial después. ➖ La documentación no puede contener datos personales reales: todos los ejemplos son inventados. ➖ **Consecuencia inmediata:** se eliminó el correo del cliente de `CLAUDE.md` y se reescribió el commit inicial antes de abrir el repositorio.

---

<!-- Plantilla para nuevas decisiones

## ADR-0NN · Título
**Fecha · Aceptada | Reemplazada por ADR-0MM**

**Contexto.**
**Decisión.**
**Alternativas.**
**Consecuencias.** ➕ … ➖ …
-->
