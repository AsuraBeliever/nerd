# 02 · Stack técnico

Cada decisión aquí la tomé yo (developer) y está justificada. El criterio general: **madurez sobre novedad, y menos piezas movibles sobre más**. Es un proyecto personal de largo plazo — lo que menos queremos es pelearnos con la herramienta dentro de seis meses.

---

## Resumen

| Capa | Elección | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| UI | React | 19.x |
| Lenguaje | TypeScript (strict) | 5.x |
| Estilos | Tailwind CSS | v4 |
| Componentes | shadcn/ui (Radix UI) | latest |
| Base de datos | PostgreSQL en Neon | 17 |
| ORM | Drizzle ORM + Drizzle Kit | latest |
| Autenticación | Auth.js (NextAuth) v5 + Google | 5.x |
| Validación | Zod | 4.x |
| Estado servidor | Server Actions + TanStack Query | 5.x |
| Formularios | React Hook Form | 7.x |
| Gráficas | Recharts | 2.x |
| Fechas | date-fns + date-fns-tz | 4.x |
| Lint / formato | Biome | 2.x |
| Tests unitarios | Vitest | 3.x |
| Tests E2E | Playwright | latest |
| PWA / offline | Serwist | latest |
| Hosting | Vercel | — |
| CI | GitHub Actions | — |

---

## Justificación pieza por pieza

### Next.js 15 + React 19
Una sola base de código para frontend y backend. Los **Server Components** dejan que el horario y las listas se rendericen en el servidor consultando la base de datos directamente — sin API REST intermedia, sin estados de carga innecesarios. Las **Server Actions** cubren las mutaciones (crear tarea, registrar serie) sin escribir endpoints. Además, Vercel es su creador: el deploy es literalmente conectar el repo.

*Alternativas descartadas:* Remix (excelente, pero menor ecosistema de componentes); SvelteKit (menos maduro para lo que necesitamos); SPA + API separada (dos proyectos que mantener, sin ganancia aquí).

### TypeScript estricto
Un modelo de datos con relaciones (materia → bloques → tareas, rutina → ejercicios → series) se vuelve inmanejable sin tipos. Con Drizzle, los tipos salen del esquema de la base de datos automáticamente: si cambio una columna, el compilador me dice qué se rompió.

### Tailwind CSS v4 + shadcn/ui
El usuario pidió minimalismo. Tailwind da control total sin escribir CSS suelto que se pudre. shadcn/ui **no es una librería de componentes** — copia el código de cada componente dentro del proyecto, sobre Radix UI (accesibilidad seria: teclado, lectores de pantalla, foco). Eso significa cero dependencia externa de estilos y libertad total para desnudarlos hasta el mínimo. Es la combinación exacta para "minimalista pero bien hecho".

*Alternativas descartadas:* Material UI (opinionado y pesado, imposible de hacer minimalista); Chakra (runtime CSS-in-JS, más lento); CSS puro (no escala).

### PostgreSQL en Neon
Nuestros datos son profundamente relacionales. Postgres además nos da tipos que importan aquí: `time` para bloques de horario, `timestamptz` para fechas correctas entre zonas horarias, `numeric` exacto para los pesos del entrenamiento (nada de errores de punto flotante en un PR). Neon ofrece Postgres serverless con plan gratuito real, escala a cero cuando no se usa, y da **ramas de base de datos** — una copia instantánea de los datos por rama de git, perfecta para el flujo de trabajo que definimos.

*Alternativas descartadas:* Supabase (trae de más: auth propia, storage, realtime — no lo necesitamos y complica); SQLite/Turso (bueno, pero Postgres es el destino natural); MongoDB (mal ajuste para datos relacionales).

### Drizzle ORM
El esquema se define en TypeScript y de ahí salen tanto los tipos como las migraciones SQL. Genera SQL predecible y legible — nada de consultas mágicas lentas. Es delgado, ideal para entornos serverless donde el arranque en frío cuenta.

*Alternativa descartada:* Prisma (excelente DX, pero motor binario pesado y arranques en frío notables en serverless).

### Auth.js v5 + Google OAuth
El usuario pidió login con Google. Auth.js es el estándar del ecosistema Next.js, tiene adaptador oficial de Drizzle (las tablas de sesión se crean solas) y deja la puerta abierta a agregar GitHub o correo después sin rehacer nada. Sesiones en base de datos, no solo JWT, para poder cerrar sesión de verdad.

### Zod + React Hook Form
Un solo esquema de validación que se usa en el formulario del navegador **y** en el servidor. Imposible que se desincronicen. React Hook Form mantiene los formularios rápidos (sin re-render en cada tecla), que importa en el registro de series del entrenamiento, donde se escribe mucho y rápido.

### TanStack Query (uso acotado)
La mayoría de la app usa Server Components y no necesita estado de cliente. Pero dos pantallas sí: **marcar tareas como hechas** y **registrar series del entrenamiento** — ahí queremos que la interfaz responda al instante (actualización optimista) aunque la red esté lenta. TanStack Query resuelve exactamente eso. No se usa en ningún otro lado.

### Recharts
Gráficas declarativas en React, responsivas, y estilizables hasta quedar minimalistas (sin cuadrículas, sin bordes, solo la línea y los ejes). Suficiente para líneas de progreso, barras de volumen semanal y mapas de calor de asistencia.

*Alternativa descartada:* Chart.js (canvas, menos integrado con React); D3 puro (poder de sobra, costo de desarrollo alto).

### date-fns + date-fns-tz
Manejo de fechas modular (solo se importa lo que se usa) e inmutable. La zona horaria importa: un examen "el viernes a las 7pm" debe seguir siendo viernes 7pm sin importar dónde se abra la app. Regla del proyecto: **guardar en UTC, mostrar en la zona del usuario**.

### Biome
Reemplaza ESLint + Prettier con una sola herramienta escrita en Rust: una configuración en vez de dos, y corre en milisegundos. Menos piezas movibles.

### Vitest + Playwright
Vitest para la lógica que puede romperse en silencio: detección de traslapes de horario, cálculo de 1RM estimado, agregación de volumen semanal, cálculo de rachas. Playwright para los caminos críticos completos: iniciar sesión, crear materia, marcar tarea, registrar entrenamiento.

### Serwist (PWA)
El usuario está en el celular, en la escuela y entrenando — donde el WiFi es malo. Serwist es el sucesor mantenido de Workbox para Next.js: instalable en la pantalla de inicio y con caché offline de lo ya visto. La escritura offline con sincronización posterior queda para una fase posterior, documentada como tal.

### Vercel + GitHub Actions
Vercel: deploy automático desde `main`, HTTPS y dominio incluidos, plan gratuito suficiente. GitHub Actions corre typecheck, lint y tests en cada rama — si algo está roto, se sabe antes de que el usuario lo vea.

---

## Variables de entorno

Todas documentadas en `.env.example` con valores falsos. Las reales viven en `.env.local` (ignorado por git) y en el panel de Vercel.

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Postgres (Neon) |
| `AUTH_SECRET` | Firma de sesiones |
| `AUTH_GOOGLE_ID` | Client ID de Google OAuth |
| `AUTH_GOOGLE_SECRET` | Client Secret de Google OAuth |
| `AUTH_URL` | URL base de la app |

## Lo que el usuario tendrá que hacer con su cuenta

Solo tres cosas, y le daré los pasos exactos cuando toque:

1. Crear cuenta en **Neon** y darme la cadena de conexión.
2. Crear el proyecto OAuth en **Google Cloud Console** y darme Client ID y Secret.
3. Crear cuenta en **Vercel** y conectar el repo de GitHub.

Todo lo demás lo hago yo.
