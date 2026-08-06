# 06 · Roadmap

El usuario quiere todas las funcionalidades. El orden de abajo no es un recorte del alcance — es la secuencia que evita rehacer trabajo, porque **cada fase se apoya en la anterior**.

Cada fase = **una rama**. Cada fase termina con: revisión del usuario en local → aprobación → merge a `main` → producción.

Una decisión importante: **se despliega a producción desde la Fase 1**, no al final. Así la app está viva desde temprano, cada fase entrega valor real, y no hay un "gran deploy" arriesgado al final.

---

## Fase 0 — Cimientos
**Rama:** `chore/scaffold`

Proyecto Next.js 15 + TypeScript estricto · Tailwind v4 + shadcn/ui · Biome · Vitest + Playwright · estructura de carpetas de `03-arquitectura.md` · `.env.example` con valores falsos · GitHub Actions (typecheck + lint + tests) · protecciones del repo público (`08-seguridad.md`).

✅ **Listo cuando:** `npm run dev` levanta una página, y typecheck, lint y tests pasan en verde.
👀 **El usuario ve:** una página en blanco con la tipografía y colores del sistema de diseño. Poco, pero es el piso de todo.

---

## Fase 1 — Cuenta y esqueleto
**Rama:** `feat/auth-google`

Base de datos en Neon · esquema Drizzle de autenticación + primeras migraciones · Auth.js v5 con Google · `requireUser()` · landing pública · layout de la app con navegación (lateral en escritorio, barra inferior en móvil) · ajustes básicos (tema, zona horaria detectada del navegador) · **despliegue a producción en Vercel** · prueba E2E de aislamiento entre usuarios.

✅ **Listo cuando:** el usuario entra con su cuenta de Google desde el celular, en producción, con HTTPS.
👀 **El usuario ve:** la app existiendo de verdad, con su nombre y foto arriba. Vacía por dentro, pero suya.
🔑 **Requiere del usuario:** cuenta de Neon, proyecto OAuth en Google Cloud, cuenta de Vercel. Le doy los pasos exactos.

---

## Fase 2 — Horario escolar
**Rama:** `feat/class-schedule`

Semestres · materias (nombre, clave, profesor, salón, color) · bloques de horario · **los 7 días soportados por igual**, con los días visibles configurables · validación de traslapes · cuadrícula semanal en escritorio y vista por día deslizable en móvil · widget "clase actual / siguiente" · archivar semestre.

✅ **Listo cuando:** el horario real del usuario está capturado y se ve bien en ambos dispositivos.
📄 Ficha: [`features/horario.md`](./features/horario.md)

---

## Fase 3 — Asistencia y faltas
**Rama:** `feat/attendance`

Registro de asistencia por sesión de clase (asistí / falté / tarde / justificada / cancelada) desde el horario con un toque · **porcentaje mínimo configurable, global y por materia** · cálculo de **faltas restantes** · semáforo de riesgo · vista de resumen por semestre · reglas configurables de justificadas y retardos.

Va justo después del horario porque se cuelga de los bloques de clase, y porque es información que se pierde si no se captura el mismo día — entre más pronto exista, más historial real acumula.

✅ **Listo cuando:** el usuario marca su asistencia del día en dos toques y ve cuántas faltas le quedan en cada materia.
📄 Ficha: [`features/asistencia.md`](./features/asistencia.md)

---

## Fase 4 — Tareas y exámenes
**Rama:** `feat/academic-tasks`

Tabla `tasks` · crear/editar/completar tareas ligadas a materia · tipos (tarea, examen, proyecto, lectura) · fechas con o sin hora · prioridad · subtareas · vista por materia y vista de próximos vencimientos · fechas en lenguaje natural con color de urgencia · captura rápida.

✅ **Listo cuando:** el usuario captura una tarea en menos de 15 segundos y sabe al instante qué vence esta semana.
📄 Ficha: [`features/academico.md`](./features/academico.md)

---

## Fase 5 — Pendientes generales
**Rama:** `feat/personal-todos`

Sección propia para pendientes sin materia · reordenar arrastrando · agrupación por fecha · completar con deshacer.

Fase corta y de bajo riesgo: reutiliza toda la maquinaria de la Fase 4 (misma tabla, `course_id = NULL`). Ese es exactamente el beneficio de la decisión ADR-004.

📄 Ficha: [`features/pendientes.md`](./features/pendientes.md)

---

## Fase 6 — Dashboard "Hoy"
**Rama:** `feat/dashboard`

Clases de hoy con la actual resaltada · registro rápido de asistencia de las clases que ya pasaron · lo que vence hoy y esta semana · pendientes personales del día · resumen de entrenamiento · alerta si alguna materia está cerca del límite de faltas.

Va aquí, y no antes, porque un dashboard solo puede diseñarse bien cuando ya existen los datos que resume.

📄 Ficha: [`features/dashboard.md`](./features/dashboard.md)

---

## Fase 7 — Ajustes y preferencias
**Rama:** `feat/settings`

La fase donde se cumple la petición del cliente de que **todo sea a libre elección**, no solo lo que a él le sirve hoy:

Unidad de peso (kg/lb) · porcentaje mínimo de asistencia global · reglas de justificadas y retardos · día de inicio de semana · días visibles en el horario · zona horaria · tema · equipo de entrenamiento disponible · **interruptor para activar calificaciones** (las columnas ya existen dormidas desde la Fase 4, ver ADR-013) · exportar todos los datos a JSON · borrar cuenta.

✅ **Listo cuando:** una persona con costumbres distintas a las del cliente puede configurar la app a su modo sin tocar el código.

---

## Fase 8 — Entrenamiento: catálogo y rutinas
**Rama:** `feat/training-foundation`

Tablas de ejercicios y rutinas · catálogo precargado de ~60 ejercicios en español, **con el entrenamiento en casa como caso principal** (peso corporal, mancuernas, bandas) · filtro por equipo disponible · ejercicios propios · crear rutinas con objetivos · duplicar rutina.

📄 Ficha: [`features/entrenamiento.md`](./features/entrenamiento.md)

---

## Fase 9 — Entrenamiento: registrar
**Rama:** `feat/training-tracking`

**La pantalla más importante del módulo.** Sesión desde rutina o libre · registro de series con actualización optimista · precarga de los valores de la última vez · temporizador de descanso · calentamiento · récord personal detectado en el momento · historial · peso corporal · incrementos correctos según la unidad elegida.

✅ **Listo cuando:** el usuario registra un entrenamiento completo sin frustrarse, y cada serie toma menos de 5 segundos.

---

## Fase 10 — Entrenamiento: progreso
**Rama:** `feat/training-progress`

Aquí se cumple lo que el usuario pidió: *"ver cómo voy mejorando o empeorando"*.

Veredicto claro (subiendo / estable / bajando) · progreso por ejercicio **adaptado al tipo**: 1RM estimado con carga, mejor serie en repeticiones sin carga, mejor tiempo en isométricos · volumen semanal por grupo muscular · récords personales · racha de constancia · peso corporal.

El detalle de por qué esto importa entrenando en casa está en la ficha.

---

## Fase 11 — PWA, pulido y v1.0.0
**Rama:** `chore/pwa-and-polish`

Serwist: instalable en pantalla de inicio, caché offline de lo ya visto · íconos y splash · optimización hasta Lighthouse ≥ 95 · pruebas E2E de los caminos críticos · repaso de accesibilidad · repaso de seguridad completo contra `08-seguridad.md` · `CHANGELOG.md` y etiqueta **`v1.0.0`**.

✅ **Listo cuando:** la app está instalada en el celular del usuario y él la usa sin pensar en que es una página web.

---

## Después de la v1 (backlog)

Cada uno en su propia rama, cuando el usuario los pida:

`feat/grades` calificaciones y promedio *(la base de datos ya está lista — ver ADR-013)* · `feat/notifications` recordatorios push, incluida alerta al acercarse al límite de faltas · `feat/calendar-sync` Google Calendar · `feat/schedule-import` importar horario desde PDF · `feat/schedule-exceptions` clases movidas o canceladas por día · `feat/study-timer` Pomodoro y tiempo de estudio · `feat/offline-writes` escritura sin conexión con sincronización · `feat/training-templates` rutinas prearmadas · `feat/nutrition` registro de alimentación.

---

## Cómo se mide el avance

El usuario no ve porcentajes; ve funcionalidades corriendo en su teléfono. Cada fase termina en producción y él la usa antes de que empiece la siguiente. Si a mitad de una fase decide que quiere otra cosa primero, esa rama se estaciona (ver `07-git-workflow.md`) y arrancamos la nueva sin perder nada.
