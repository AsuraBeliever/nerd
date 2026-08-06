# 03 · Arquitectura

## Idea central

Tres capas, con una regla estricta entre ellas:

```
┌──────────────────────────────────────────────┐
│  UI (React Server Components + Client)       │  Solo presenta. No sabe de SQL.
├──────────────────────────────────────────────┤
│  Capa de datos (queries + actions)           │  Único lugar que toca la BD.
│  ↳ valida sesión, valida input, filtra userId│  Frontera de seguridad.
├──────────────────────────────────────────────┤
│  Base de datos (Drizzle → PostgreSQL)        │  Esquema y migraciones.
└──────────────────────────────────────────────┘
```

**La UI nunca importa `db` directamente.** Siempre pasa por la capa de datos. Eso concentra la verificación de sesión y el filtro por usuario en un solo lugar auditable, en vez de esparcirlo por 40 componentes.

---

## Estructura de carpetas

```
nerd/
├── CLAUDE.md
├── docs/
├── drizzle/                     # migraciones SQL generadas (versionadas en git)
├── public/
├── e2e/                         # pruebas Playwright
└── src/
    ├── app/
    │   ├── (marketing)/         # landing pública
    │   │   └── page.tsx
    │   ├── (app)/               # todo lo que requiere sesión
    │   │   ├── layout.tsx       # guard de sesión + navegación
    │   │   ├── page.tsx         # dashboard / "hoy"
    │   │   ├── horario/
    │   │   ├── materias/[courseId]/
    │   │   ├── asistencia/
    │   │   ├── tareas/
    │   │   ├── pendientes/
    │   │   ├── entrenamiento/
    │   │   │   ├── rutinas/
    │   │   │   ├── entrenar/
    │   │   │   ├── historial/
    │   │   │   └── progreso/
    │   │   └── ajustes/
    │   ├── api/auth/[...nextauth]/
    │   ├── layout.tsx
    │   └── globals.css
    │
    ├── components/
    │   ├── ui/                  # primitivos shadcn (button, dialog, input…)
    │   ├── layout/              # nav, sidebar, header, bottom-bar móvil
    │   └── shared/              # empty-state, date-picker, color-picker…
    │
    ├── features/                # ⬅ el corazón: código agrupado por dominio
    │   ├── schedule/
    │   │   ├── components/
    │   │   ├── queries.ts       # lecturas
    │   │   ├── actions.ts       # escrituras (Server Actions)
    │   │   ├── schemas.ts       # Zod
    │   │   └── lib.ts           # lógica pura (traslapes, orden por día)
    │   ├── courses/
    │   ├── attendance/          # incluye el cálculo de faltas restantes
    │   ├── tasks/               # cubre tareas académicas Y pendientes generales
    │   ├── training/            # incluye units.ts (kg ↔ lb)
    │   ├── settings/            # preferencias del usuario
    │   └── dashboard/
    │
    ├── db/
    │   ├── index.ts             # cliente Drizzle
    │   ├── schema/              # un archivo por dominio
    │   │   ├── auth.ts
    │   │   ├── academic.ts
    │   │   ├── attendance.ts
    │   │   ├── tasks.ts
    │   │   ├── training.ts
    │   │   └── index.ts
    │   └── seed.ts
    │
    ├── lib/
    │   ├── auth.ts              # configuración Auth.js
    │   ├── session.ts           # requireUser() — helper obligatorio
    │   ├── dates.ts             # zona horaria, formateo
    │   ├── utils.ts
    │   └── constants.ts
    │
    └── types/
```

**Por qué `features/` y no carpetas por tipo de archivo:** cuando el usuario pida "cambia cómo se ven las tareas", todo lo relacionado está en `features/tasks/` — componentes, consultas, validación y lógica. No hay que saltar entre cinco carpetas. Esto también hace que las ramas por funcionalidad casi nunca choquen entre sí al hacer merge.

---

## Flujo de datos

### Lectura (la mayoría de las pantallas)

```
Página (Server Component)
   → requireUser()                    ← redirige a login si no hay sesión
   → features/x/queries.ts            ← recibe userId, filtra por él
   → Drizzle → PostgreSQL
   → HTML renderizado en el servidor
```

Sin estados de carga, sin `useEffect`, sin cascadas de peticiones. La página llega con los datos puestos.

### Escritura

```
Formulario (Client Component)
   → React Hook Form + Zod (validación inmediata en pantalla)
   → Server Action
        1. requireUser()               ← ¿hay sesión?
        2. schema.parse(input)         ← ¿el dato es válido?
        3. verificar propiedad         ← ¿este recurso es de este usuario?
        4. escribir en la BD
        5. revalidatePath()            ← refrescar la vista
   → UI actualizada
```

Los pasos 1–3 son **obligatorios en toda Server Action**. Sin excepción.

### Escrituras optimistas (solo dos casos)

Marcar una tarea como hecha y registrar una serie de entrenamiento usan `useOptimistic` / TanStack Query: la interfaz cambia al instante y, si el servidor falla, se revierte con un aviso. Son las dos acciones que se repiten decenas de veces al día — la espera ahí se siente.

---

## Seguridad multiusuario

Es el riesgo número uno de la app. Tres capas de defensa:

1. **`requireUser()`** al inicio de toda query y toda action. Devuelve el usuario de la sesión o lanza/redirige.
2. **Filtro por `userId` en toda consulta.** Toda tabla de datos tiene columna `user_id`. Ninguna consulta se escribe sin ese `where`.
3. **Verificación de propiedad en cascada.** Antes de escribir en un recurso hijo (por ejemplo, una tarea de una materia), se confirma que el padre pertenece al usuario. No basta con que el ID exista.

Además, las claves foráneas usan `ON DELETE CASCADE` desde `users`: borrar la cuenta borra absolutamente todo lo del usuario.

---

## Rendimiento

- Server Components por defecto → menos JavaScript enviado al navegador.
- Índices en todas las columnas que se filtran (`user_id`, `due_at`, `term_id`, `workout_id`) — ver `04-modelo-de-datos.md`.
- `next/font` para tipografía sin parpadeo ni petición externa.
- Objetivo: **Lighthouse ≥ 95** en móvil, interacción visible en menos de 100 ms.
- Los cálculos de progreso del entrenamiento se agregan **en SQL**, no trayendo miles de series al navegador.

## Manejo de errores

- `error.tsx` y `not-found.tsx` por sección, con mensajes en español y sin jerga técnica.
- Las Server Actions devuelven `{ ok: true, data }` o `{ ok: false, error }` — nunca lanzan excepciones sin capturar hacia la UI.
- Estados vacíos diseñados a propósito: cada lista vacía explica qué es y ofrece el botón para crear el primer elemento.
