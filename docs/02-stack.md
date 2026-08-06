# 02 · Stack técnico

Cada decisión aquí la tomé yo (developer) y está justificada. El criterio general: **madurez sobre novedad, y menos piezas movibles sobre más**. Es un proyecto personal de largo plazo — lo que menos queremos es pelearnos con la herramienta dentro de seis meses.

---

## Resumen

| Capa | Elección | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| UI | React | 19.x |
| Lenguaje | TypeScript (strict) | 5.x |
| Estilos | Tailwind CSS | v4 |
| Componentes | Propios, sobre HTML nativo (ADR-017) | — |
| Base de datos | PostgreSQL — Docker en local, Neon en producción (ADR-015) | 17 |
| ORM | Drizzle ORM + Drizzle Kit | latest |
| Autenticación | Auth.js (NextAuth) v5 + Google | 5.x |
| Validación | Zod | 4.x |
| Estado servidor | Server Actions + `useOptimistic` (ADR-018) | React 19 |
| Formularios | `<form action>` + Zod en el servidor (ADR-018) | — |
| Gráficas | SVG en línea, escrito a mano (ADR-018) | — |
| Fechas | date-fns + @date-fns/tz | 4.x |
| Lint / formato | Biome | 2.x |
| Tests unitarios | Vitest | 3.x |
| Tests E2E | Playwright | latest |
| PWA / offline | Service worker propio (ADR-018) | — |
| Hosting | Vercel | — |
| CI | GitHub Actions | — |

---

## Justificación pieza por pieza

### Next.js 16 + React 19
Una sola base de código para frontend y backend. Los **Server Components** dejan que el horario y las listas se rendericen en el servidor consultando la base de datos directamente — sin API REST intermedia, sin estados de carga innecesarios. Las **Server Actions** cubren las mutaciones (crear tarea, registrar serie) sin escribir endpoints. Además, Vercel es su creador: el deploy es literalmente conectar el repo.

*Alternativas descartadas:* Remix (excelente, pero menor ecosistema de componentes); SvelteKit (menos maduro para lo que necesitamos); SPA + API separada (dos proyectos que mantener, sin ganancia aquí).

> **Nota de la Fase 0.** El plan original decía Next.js 15; al montar el proyecto, la versión estable era la **16.3**. Se usó la 16. Trae cambios que rompen respecto a la 15, así que la documentación de referencia es la que viene incluida en `node_modules/next/dist/docs/`, no la memoria ni tutoriales viejos.

### TypeScript estricto
Un modelo de datos con relaciones (materia → bloques → tareas, rutina → ejercicios → series) se vuelve inmanejable sin tipos. Con Drizzle, los tipos salen del esquema de la base de datos automáticamente: si cambio una columna, el compilador me dice qué se rompió.

### Tailwind CSS v4 + componentes propios
El usuario pidió minimalismo. Tailwind da control total sin escribir CSS suelto que se pudre.

El plan proponía shadcn/ui sobre Radix. Al construir resultó que los componentes que la app de verdad necesita son cuatro —botón, campo, select y modal— y todos existen ya en HTML: el modal usa `<dialog>`, que trae atrapado de foco, cierre con Escape y rol de accesibilidad de fábrica. Se escribieron a mano, 30 líneas cada uno (**ADR-017**). Si algún día hace falta un combobox con búsqueda, se traerá Radix para esa pieza.

*Alternativas descartadas:* Material UI (opinionado y pesado, imposible de hacer minimalista); Chakra (runtime CSS-in-JS, más lento); CSS puro (no escala).

### PostgreSQL — Docker en local, Neon en producción
En desarrollo corre un contenedor propio (`nerd-postgres`, puerto 5433) para no depender de que existan credenciales de Neon, y para no tocar el Postgres que el cliente ya tenía en el 5432 (**ADR-015**). Es el mismo Postgres 17: las migraciones y los tipos se comportan igual en los dos lados, y pasar a producción es cambiar `DATABASE_URL`.

Nuestros datos son profundamente relacionales. Postgres además nos da tipos que importan aquí: `time` para bloques de horario, `timestamptz` para fechas correctas entre zonas horarias, `numeric` exacto para los pesos del entrenamiento (nada de errores de punto flotante en un PR). Neon ofrece Postgres serverless con plan gratuito real, escala a cero cuando no se usa, y da **ramas de base de datos** — una copia instantánea de los datos por rama de git, perfecta para el flujo de trabajo que definimos.

*Alternativas descartadas:* Supabase (trae de más: auth propia, storage, realtime — no lo necesitamos y complica); SQLite/Turso (bueno, pero Postgres es el destino natural); MongoDB (mal ajuste para datos relacionales).

### Drizzle ORM
El esquema se define en TypeScript y de ahí salen tanto los tipos como las migraciones SQL. Genera SQL predecible y legible — nada de consultas mágicas lentas. Es delgado, ideal para entornos serverless donde el arranque en frío cuenta.

*Alternativa descartada:* Prisma (excelente DX, pero motor binario pesado y arranques en frío notables en serverless).

### Auth.js v5 + Google OAuth
El usuario pidió login con Google. Auth.js es el estándar del ecosistema Next.js, tiene adaptador oficial de Drizzle (las tablas de sesión se crean solas) y deja la puerta abierta a agregar GitHub o correo después sin rehacer nada. Sesiones en base de datos, no solo JWT, para poder cerrar sesión de verdad.

### Zod, sin librería de formularios
Un solo esquema de validación que corre en el servidor, siempre, aunque el navegador ya haya validado. Los formularios usan `<form action={…}>` con Server Actions: React Hook Form estaba en el plan, se instaló, no se usó nunca y se desinstaló al terminar (**ADR-018**).

### Actualizaciones optimistas con React 19
Dos pantallas necesitan responder al instante aunque la red vaya lenta: **completar una tarea** y **registrar una serie**. React 19 trae `useOptimistic`, que hace exactamente eso. TanStack Query estaba en el plan y resultó innecesario (**ADR-018**).

### Gráficas en SVG, escritas a mano
Una línea y unas barras, sin cuadrícula ni leyendas. Son ~60 líneas que se renderizan en el servidor y usan los tokens del sistema de diseño. Recharts habría sido ~90 KB de JavaScript en el celular a cambio de nada (**ADR-018**).

### date-fns + @date-fns/tz
Manejo de fechas modular (solo se importa lo que se usa) e inmutable. La zona horaria importa: un examen "el viernes a las 7pm" debe seguir siendo viernes 7pm sin importar dónde se abra la app. Regla del proyecto: **guardar en UTC, mostrar en la zona del usuario**.

### Biome
Reemplaza ESLint + Prettier con una sola herramienta escrita en Rust: una configuración en vez de dos, y corre en milisegundos. Menos piezas movibles.

### Vitest + Playwright
Vitest para la lógica que puede romperse en silencio: detección de traslapes de horario, cálculo de 1RM estimado, agregación de volumen semanal, cálculo de rachas. Playwright para los caminos críticos completos: iniciar sesión, crear materia, marcar tarea, registrar entrenamiento.

### PWA con un service worker propio
El usuario está en el celular, en la escuela y entrenando — donde el WiFi es malo. La app es instalable y abre sin conexión lo que ya se visitó. Son ~50 líneas legibles en `public/sw.js`; Serwist estaba en el plan y traía una capa de build completa para un caso que no la pide (**ADR-018**). La escritura sin conexión con sincronización posterior sí la justificaría, y está en el backlog.

### Vercel + GitHub Actions
Vercel: deploy automático desde `main`, HTTPS y dominio incluidos, plan gratuito suficiente. GitHub Actions corre typecheck, lint y tests en cada rama — si algo está roto, se sabe antes de que el usuario lo vea.

---

## Variables de entorno

Todas documentadas en `.env.example` con valores falsos. Las reales viven en `.env.local` (ignorado por git) y en el panel de Vercel.

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Postgres (Docker en local, Neon en producción) |
| `AUTH_SECRET` | Firma de sesiones |
| `AUTH_GOOGLE_ID` | Client ID de Google OAuth |
| `AUTH_GOOGLE_SECRET` | Client Secret de Google OAuth |
| `AUTH_URL` | URL base de la app |
| `DEV_LOGIN` | Solo desarrollo: acceso sin Google (ADR-016). No existe en producción. |

## Lo que el usuario tendrá que hacer con su cuenta

Solo tres cosas, y le daré los pasos exactos cuando toque:

1. Crear cuenta en **Neon** y darme la cadena de conexión.
2. Crear el proyecto OAuth en **Google Cloud Console** y darme Client ID y Secret.
3. Crear cuenta en **Vercel** y conectar el repo de GitHub.

Todo lo demás lo hago yo.
