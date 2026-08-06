# 07 · Flujo de git y versionado

> El developer (Claude) opera git en su totalidad. El usuario **nunca** necesita escribir un comando de git.

## Las dos reglas del cliente

1. **Local primero, producción después.** El usuario revisa cada cambio en `http://localhost:3000` y solo después se sube.
2. **Una petición = una rama.** Si algo queda a medias y llega una idea nueva, la nueva arranca en rama propia. Nunca se mezclan dos ideas.

---

## Ramas

```
main ─────●─────────●──────────────●────────►  producción (Vercel despliega de aquí)
           \       /                \
            ●──●──●                  ●──●──●   feat/…  (trabajo)
            feat/class-schedule      feat/gym-tracking
```

| Rama | Rol |
|---|---|
| `main` | **Producción.** Siempre desplegable. Solo recibe merges aprobados por el usuario. |
| `feat/*` `fix/*` `chore/*` `refactor/*` `docs/*` `style/*` | Trabajo en curso. Una por petición. |

No hay rama `develop`. Para un proyecto de un solo desarrollador es burocracia sin beneficio: `main` + ramas de trabajo cubre todo, y Vercel genera un *preview* automático por rama si algún día se quiere revisar desde el celular.

---

## Ciclo de vida de una petición

```bash
# 1. Arrancar desde main actualizado
git switch main && git pull
git switch -c feat/class-schedule

# 2. Trabajar con commits atómicos (libre, sin pedir permiso)
git commit -m "feat(schedule): add course_blocks table and migration"
git commit -m "feat(schedule): add weekly grid component"

# 3. Levantar local y avisar al usuario
npm run dev     # → "revísalo en http://localhost:3000"

# 4. ⛔ ESPERAR APROBACIÓN EXPLÍCITA

# 5. Con el visto bueno: subir e integrar
git push -u origin feat/class-schedule
git switch main
git merge --no-ff feat/class-schedule
git push origin main            # ← Vercel despliega a producción
git branch -d feat/class-schedule
```

`--no-ff` siempre: conserva el commit de merge, así el historial muestra dónde empezó y terminó cada funcionalidad.

---

## Ramas estacionadas (trabajo incompleto)

Cuando algo queda a medias:

1. **No se borra. No se mergea.** Se queda tal cual.
2. Se hace commit de lo que haya, con prefijo `wip:` si no está funcional.
3. Se hace push al remoto (respaldo — está permitido, no toca `main`).
4. **Se registra en `docs/BITACORA.md`**: rama, fecha, qué quedó hecho, qué falta, cuál es el siguiente paso concreto.

Así, meses después, retomar es leer una entrada de la bitácora y hacer `git switch`. Nada se pierde y nada se contamina.

---

## Mensajes de commit

[Conventional Commits](https://www.conventionalcommits.org/): `tipo(alcance): descripción en imperativo`

| Tipo | Uso |
|---|---|
| `feat` | funcionalidad nueva |
| `fix` | corrección de bug |
| `docs` | solo documentación |
| `style` | formato o apariencia, sin cambio de lógica |
| `refactor` | reorganización sin cambio de comportamiento |
| `perf` | mejora de rendimiento |
| `test` | pruebas |
| `chore` | configuración, dependencias, tooling |
| `wip` | trabajo incompleto en rama estacionada |

Alcances del proyecto: `schedule` `courses` `tasks` `todos` `gym` `dashboard` `auth` `ui` `db` `docs` `ci`

Todo commit cierra con:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

## Versionado

SemVer en `package.json`, etiquetado en cada despliegue a producción.

- `0.x.y` durante el desarrollo de la v1.
- `1.0.0` cuando las cinco funcionalidades estén en producción y en uso real.
- `MINOR` — funcionalidad nueva · `PATCH` — correcciones.

```bash
git tag -a v0.3.0 -m "Horario escolar completo"
git push origin v0.3.0
```

`CHANGELOG.md` se actualiza en cada release, en español, describiendo lo que el usuario puede hacer ahora — no los cambios internos.

---

## Ambientes

| Ambiente | Rama | Base de datos | URL |
|---|---|---|---|
| Local | la de trabajo | rama de Neon `dev` | `localhost:3000` |
| Preview | cualquier rama subida | rama de Neon `dev` | URL automática de Vercel |
| Producción | `main` | rama `main` de Neon | dominio de producción |

Las *ramas de base de datos* de Neon permiten probar migraciones destructivas sin tocar los datos reales del usuario.

---

## Prohibiciones

- ⛔ Push a `main` sin aprobación explícita tras revisión local.
- ⛔ Commit directo sobre `main` (salvo el commit inicial del repo).
- ⛔ `git push --force` sobre `main`, jamás.
- ⛔ Mezclar dos funcionalidades distintas en una misma rama.
- ⛔ Commitear `.env.local`, secretos o credenciales.
- ⛔ Borrar una rama estacionada sin autorización del usuario.
