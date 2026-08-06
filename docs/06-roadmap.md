# 06 · Roadmap

El usuario quiere las cinco funcionalidades. El orden de abajo no es un recorte del alcance — es la secuencia que evita rehacer trabajo, porque **cada fase se apoya en la anterior**.

Cada fase = **una rama**. Cada fase termina con: revisión del usuario en local → aprobación → merge a `main` → producción.

Una decisión importante: **se despliega a producción desde la Fase 1**, no al final. Así la app está viva desde temprano, cada fase entrega valor real, y no hay un "gran deploy" arriesgado al final.

---

## Fase 0 — Cimientos
**Rama:** `chore/scaffold`

Proyecto Next.js 15 + TypeScript estricto · Tailwind v4 + shadcn/ui · Biome · Vitest + Playwright · estructura de carpetas de `03-arquitectura.md` · `.env.example` · GitHub Actions (typecheck + lint + tests) · repo en GitHub.

✅ **Listo cuando:** `npm run dev` levanta una página, y typecheck, lint y tests pasan en verde.
👀 **El usuario ve:** una página en blanco con la tipografía y colores del sistema de diseño. Poco, pero es el piso de todo.

---

## Fase 1 — Cuenta y esqueleto
**Rama:** `feat/auth-google`

Base de datos en Neon · esquema Drizzle de autenticación + primeras migraciones · Auth.js v5 con Google · `requireUser()` · landing pública · layout de la app con navegación (lateral en escritorio, barra inferior en móvil) · pantalla de Ajustes con modo claro/oscuro y zona horaria · **despliegue a producción en Vercel**.

✅ **Listo cuando:** el usuario entra con su cuenta de Google desde el celular, en producción, con HTTPS.
👀 **El usuario ve:** la app existiendo de verdad, con su nombre y foto arriba. Vacía por dentro, pero suya.
🔑 **Requiere del usuario:** cuenta de Neon, proyecto OAuth en Google Cloud, cuenta de Vercel. Le doy los pasos exactos.

---

## Fase 2 — Horario escolar
**Rama:** `feat/class-schedule`

Semestres · materias (nombre, clave, profesor, salón, color) · bloques de horario · validación de traslapes · **cuadrícula semanal** en escritorio y **vista por día** deslizable en móvil · widget "clase actual / siguiente clase" · archivar semestre.

✅ **Listo cuando:** el horario real del usuario está capturado y se ve bien en ambos dispositivos.
👀 **El usuario ve:** su semana completa de un vistazo, con colores por materia. Primera funcionalidad que usa a diario.
📄 Ficha: [`features/horario.md`](./features/horario.md)

---

## Fase 3 — Tareas y exámenes
**Rama:** `feat/academic-tasks`

Tabla `tasks` · crear/editar/completar tareas ligadas a materia · tipos (tarea, examen, proyecto, lectura) · fechas con o sin hora · prioridad · subtareas · vista **por materia** y vista **"próximos vencimientos"** · fechas en lenguaje natural con color de urgencia · captura rápida.

✅ **Listo cuando:** el usuario captura una tarea en menos de 15 segundos y sabe al instante qué vence esta semana.
👀 **El usuario ve:** la app dejando de ser un horario bonito y volviéndose útil.
📄 Ficha: [`features/academico.md`](./features/academico.md)

---

## Fase 4 — Pendientes generales
**Rama:** `feat/personal-todos`

Sección propia para pendientes sin materia · reordenar arrastrando · agrupación por fecha (hoy / esta semana / después / sin fecha) · completar con deshacer.

Fase corta y de bajo riesgo: reutiliza toda la maquinaria de la Fase 3 (misma tabla, `course_id = NULL`). Ese es exactamente el beneficio de la decisión de modelo de datos.

✅ **Listo cuando:** los pendientes personales viven separados de lo escolar, pero conviven en "hoy".
📄 Ficha: [`features/pendientes.md`](./features/pendientes.md)

---

## Fase 5 — Dashboard "Hoy"
**Rama:** `feat/dashboard`

Pantalla de inicio: clases de hoy con la actual resaltada · lo que vence hoy y esta semana · pendientes personales del día · resumen del gimnasio · estado vacío útil para cuando no hay nada.

Va aquí, y no antes, porque un dashboard solo puede diseñarse bien cuando ya existen los datos que resume.

✅ **Listo cuando:** el usuario abre la app y sabe qué hacer sin tocar nada más.
📄 Ficha: [`features/dashboard.md`](./features/dashboard.md)

---

## Fase 6 — Gimnasio: catálogo y rutinas
**Rama:** `feat/gym-foundation`

Tablas de ejercicios y rutinas · catálogo precargado de ~60 ejercicios en español · ejercicios propios · crear rutinas con series/repeticiones/peso objetivo · reordenar ejercicios · duplicar rutina.

✅ **Listo cuando:** el usuario tiene sus rutinas reales capturadas.
📄 Ficha: [`features/gimnasio.md`](./features/gimnasio.md)

---

## Fase 7 — Gimnasio: registrar entrenamiento
**Rama:** `feat/gym-tracking`

**La pantalla más importante del módulo.** Iniciar sesión desde una rutina o libre · registrar series con actualización optimista · precargar los valores de la última vez para ese ejercicio · temporizador de descanso · marcar calentamiento · detección de récord personal en el momento · historial de entrenamientos · registro de peso corporal.

Diseñada para el gimnasio real: pulgar, una mano, pantalla encendida, WiFi malo.

✅ **Listo cuando:** el usuario registra un entrenamiento completo sin frustrarse, y cada serie toma menos de 5 segundos.

---

## Fase 8 — Gimnasio: progreso
**Rama:** `feat/gym-progress`

Aquí se cumple lo que el usuario pidió: *"ver cómo voy mejorando o empeorando"*.

1RM estimado por ejercicio a lo largo del tiempo · volumen semanal total y por grupo muscular · récords personales · racha de entrenamientos · comparación últimas 4 semanas vs. 4 anteriores con veredicto claro ("subiendo", "estable", "bajando") · peso corporal en el tiempo.

Todos los agregados se calculan en SQL. Gráficas Recharts minimalistas.

✅ **Listo cuando:** el usuario ve una gráfica de su press de banca y entiende en un segundo si va progresando.

---

## Fase 9 — PWA, pulido y v1.0.0
**Rama:** `chore/pwa-and-polish`

Serwist: instalable en pantalla de inicio, caché offline de lo ya visto · íconos y splash · exportar todos los datos a JSON · optimización hasta Lighthouse ≥ 95 · pruebas E2E de los caminos críticos · repaso de accesibilidad · `CHANGELOG.md` y etiqueta **`v1.0.0`**.

✅ **Listo cuando:** la app está instalada en el celular del usuario y él la usa sin pensar en que es una página web.

---

## Después de la v1 (backlog)

Cada uno en su propia rama, cuando el usuario los pida:

`feat/notifications` recordatorios push · `feat/grades` calificaciones y promedio · `feat/calendar-sync` Google Calendar · `feat/schedule-import` importar horario desde PDF · `feat/study-timer` Pomodoro y tiempo de estudio · `feat/offline-writes` escritura sin conexión con sincronización · `feat/gym-templates` rutinas prearmadas (PPL, Upper/Lower) · `feat/nutrition` registro de alimentación.

---

## Cómo se mide el avance

El usuario no ve porcentajes; ve funcionalidades corriendo en su teléfono. Cada fase termina en producción y él la usa antes de que empiece la siguiente. Si a mitad de una fase decide que quiere otra cosa primero, esa rama se estaciona (ver `07-git-workflow.md`) y arrancamos la nueva sin perder nada.
