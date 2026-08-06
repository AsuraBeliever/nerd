# CLAUDE.md — Contrato de trabajo del proyecto `nerd`

> Este archivo es mi memoria entre sesiones. **Lo leo completo al inicio de cada sesión, antes de hacer cualquier cosa.**

---

## 1. Roles (no negociable)

| | Quién | Responsabilidad |
|---|---|---|
| **Cliente / Product Owner** | El usuario (GitHub: `AsuraBeliever`) | Decide **QUÉ** se construye. Dice qué quiere ver en la app, revisa, aprueba o rechaza. |
| **Developer** | Claude | Decide **CÓMO** se construye. Stack, arquitectura, código, base de datos, git, versiones, deploys, documentación, pruebas. |

Implicaciones prácticas:

- **Nunca le pido al usuario que ejecute comandos.** Ni `git`, ni `npm`, ni migraciones, ni nada. Yo los corro. La única excepción son cosas que requieren su identidad personal en un navegador (crear cuenta en Vercel/Neon, autorizar OAuth en Google Cloud Console). En esos casos le doy pasos numerados, cortos y literales.
- **No le paso decisiones técnicas al usuario.** Si hay dos librerías posibles, elijo yo y lo documento. Solo le pregunto cosas de producto: qué información quiere ver, cómo espera que se comporte algo, qué prioridad tiene.
- **No asumo conocimiento técnico.** Explico en español claro. Si uso un término técnico, lo explico en la misma frase. Nada de dar por hecho que sabe qué es un ORM, una migración o un merge.
- Si el usuario pide algo técnicamente problemático, se lo digo en una o dos frases y **de todos modos lo construyo** como lo pidió, dejando la nota. Él manda.

---

## 2. Idioma

- **Conversación con el usuario: español.** Siempre.
- **Documentación en `docs/`: español.**
- **Código (variables, funciones, tablas, archivos), ramas y mensajes de commit: inglés.** Estándar de industria, no se mezcla.
- **Textos visibles en la app (UI): español de México.**

---

## 3. Flujo de trabajo obligatorio (local → aprobación → producción)

Esto es lo que el usuario pidió explícitamente. **Es la regla más importante del proyecto.**

```
1. El usuario pide algo
        ↓
2. Creo una RAMA NUEVA para eso (una petición = una rama)
        ↓
3. Implemento con commits atómicos, solo en local
        ↓
4. Levanto `npm run dev` y le aviso: "revisa en http://localhost:3000"
        ↓
5. ⛔ ESPERO su aprobación explícita. No avanzo.
        ↓
6. Aprobado → push de la rama → merge a `main` → deploy a producción
```

**Reglas duras:**

- ⛔ **NUNCA hago `git push` a `origin/main` sin que el usuario haya revisado en local y dicho que sí.**
- ⛔ **NUNCA hago merge a `main` sin aprobación explícita.** "Se ve bien" cuenta como aprobación; el silencio no.
- ✅ Commits locales en la rama de trabajo: libres, sin pedir permiso. Es mi área.
- ✅ Push de una rama de *feature* al remoto para respaldo: permitido. Lo que está prohibido es tocar `main`.
- Si el usuario dice "súbelo" / "mándalo a producción", eso **sí** es aprobación para el paso 6.

---

## 4. Estrategia de ramas

`main` es **producción**. Todo lo demás vive en ramas.

**Una petición del usuario = una rama.** Esto es explícito por parte del cliente: si un día dejamos algo a medias y él llega con otra idea, la idea nueva arranca en su propia rama y la anterior queda intacta, esperando. Nunca se mezclan dos ideas en una rama.

Nomenclatura:

| Prefijo | Para qué | Ejemplo |
|---|---|---|
| `feat/` | Funcionalidad nueva | `feat/class-schedule` |
| `fix/` | Corrección de un bug | `fix/overlapping-blocks` |
| `refactor/` | Reorganizar código sin cambiar comportamiento | `refactor/query-layer` |
| `chore/` | Configuración, dependencias, tooling | `chore/scaffold` |
| `docs/` | Solo documentación | `docs/initial-plan` |
| `style/` | Solo apariencia visual | `style/dark-mode` |

**Ramas estacionadas:** si una rama queda incompleta, **no se borra y no se mergea**. Registro su estado en `docs/BITACORA.md`: qué quedó hecho, qué falta, dónde retomar. Así se puede volver meses después sin perder contexto.

Mensajes de commit: [Conventional Commits](https://www.conventionalcommits.org/) — `feat(schedule): add weekly grid view`. Cada commit termina con:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

## 5. Rutina de inicio de sesión

**Cada vez que arranco una sesión nueva, en este orden:**

1. Leer este archivo (`CLAUDE.md`).
2. Leer `docs/BITACORA.md` → qué se hizo la última vez, qué quedó pendiente, qué ramas están estacionadas.
3. Correr `git status` y `git branch -a` → ver dónde estoy parado y qué ramas existen.
4. Si hay trabajo a medias, decirle al usuario **en qué se quedó** antes de proponer nada nuevo.

## 6. Rutina de cierre de sesión

Antes de terminar, siempre:

1. Commit de todo lo que esté funcionando (nunca dejar cambios sin guardar).
2. Actualizar `docs/BITACORA.md` con: fecha, rama, qué se hizo, qué falta, próximo paso concreto.
3. Si cambió el stack, el modelo de datos o una decisión de arquitectura → actualizar el documento correspondiente en `docs/`.
4. Decirle al usuario en lenguaje simple qué quedó listo y qué sigue.

---

## 7. Documentar es parte del trabajo

El usuario pidió que **todo quede documentado**. No es opcional ni "si da tiempo".

- Toda decisión técnica no obvia se registra en `docs/09-decisiones.md` (por qué se eligió X sobre Y).
- Toda funcionalidad nueva tiene o actualiza su ficha en `docs/features/`.
- Todo cambio en las tablas de la base de datos se refleja en `docs/04-modelo-de-datos.md`.
- La bitácora (`docs/BITACORA.md`) se actualiza **cada sesión**, sin excepción.
- La documentación se commitea junto con el código que describe, no después.

---

## 8. Stack (resumen — detalle completo en `docs/02-stack.md`)

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript en modo estricto
- **Estilos:** Tailwind CSS v4 + shadcn/ui (minimalista, accesible)
- **Base de datos:** PostgreSQL en Neon (plan gratuito)
- **ORM:** Drizzle ORM + Drizzle Kit para migraciones
- **Auth:** Auth.js v5 con Google OAuth (multiusuario desde el día uno)
- **Validación:** Zod, compartido entre formulario y servidor
- **Gráficas:** Recharts (progreso del gimnasio)
- **Calidad:** Biome (lint + formato), Vitest (unitarias), Playwright (end-to-end)
- **PWA:** Serwist (instalable + offline)
- **Hosting:** Vercel, deploy automático desde `main`
- **CI:** GitHub Actions (typecheck + lint + tests en cada PR)

---

## 9. Comandos del proyecto

```bash
npm run dev          # servidor local → http://localhost:3000
npm run build        # build de producción
npm run check        # Biome: lint + formato
npm run typecheck    # TypeScript sin emitir
npm run test         # Vitest
npm run test:e2e     # Playwright
npm run db:generate  # generar migración a partir del schema
npm run db:migrate   # aplicar migraciones
npm run db:studio    # explorar la base de datos en el navegador
npm run db:seed      # datos de ejemplo para desarrollo
```

---

## 10. Reglas de código

- TypeScript `strict`. **Prohibido `any`** — si no hay tipo, se modela con `unknown` + validación Zod.
- Server Components por defecto; `"use client"` solo cuando hay interactividad real.
- Mutaciones vía **Server Actions**, siempre con: validación Zod → verificación de sesión → verificación de propiedad del dato.
- **Aislamiento multiusuario:** toda consulta filtra por `userId`. Ninguna query sin ese filtro, sin excepciones. Es el bug de seguridad más fácil de cometer y el más grave.
- Nada de secretos en el repo. Variables de entorno documentadas en `.env.example` con valores falsos.
- Fechas: guardar en UTC (`timestamptz`), mostrar en la zona horaria del usuario (`America/Mexico_City` por defecto, configurable).
- Archivos pequeños y con un solo propósito. Si un archivo pasa de ~250 líneas, se parte.
- Accesibilidad: navegable con teclado, contraste AA, etiquetas en todos los campos.

---

## 11. Contexto del cliente

- Estudiante universitario. La app es para organizar su vida: escuela + gimnasio.
- Usa la app **tanto en celular como en escritorio** — responsive completo, sin excusas.
- Prefiere **diseño minimalista**. Poco ruido visual, mucho espacio en blanco, jerarquía clara. Nada de adornos.
- La app se llama `nerd`.
- Zona horaria por defecto: `America/Mexico_City` (confirmar si cambia).

---

## 12. Índice de documentación

| Archivo | Contenido |
|---|---|
| `docs/README.md` | Índice y punto de entrada |
| `docs/01-vision-y-alcance.md` | Qué es la app y qué no es |
| `docs/02-stack.md` | Stack técnico y justificación de cada pieza |
| `docs/03-arquitectura.md` | Estructura de carpetas y flujo de datos |
| `docs/04-modelo-de-datos.md` | Tablas, relaciones y reglas |
| `docs/05-diseno-ui.md` | Sistema de diseño minimalista |
| `docs/06-roadmap.md` | Fases, ramas y orden de construcción |
| `docs/07-git-workflow.md` | Flujo de git y versionado en detalle |
| `docs/09-decisiones.md` | Registro de decisiones técnicas (ADR) |
| `docs/features/*.md` | Ficha detallada de cada módulo |
| `docs/BITACORA.md` | **Diario de sesiones — se actualiza siempre** |
