# 08 · Seguridad y privacidad

**El repositorio es público. Cualquiera puede leer todo lo que se commitea, para siempre.** Este documento es la regla de lo que puede y no puede entrar al repo, y de cómo se protegen los datos de quienes usen la app.

Un repo público no es un problema de seguridad por sí mismo — el código abierto es auditable, y ninguna protección real de esta app depende de que el código esté oculto. Lo que sí importa es que **los secretos y los datos personales nunca crucen la línea**.

---

## 1. Qué NUNCA entra al repositorio

| Prohibido | Por qué |
|---|---|
| `.env`, `.env.local`, cualquier archivo con valores reales | Contienen la contraseña de la base de datos y las llaves de OAuth |
| Cadena de conexión de Neon | Da acceso total a los datos de todos los usuarios |
| `AUTH_SECRET` | Con él se pueden falsificar sesiones de cualquier usuario |
| `AUTH_GOOGLE_SECRET` | Permite suplantar la aplicación ante Google |
| Correos, teléfonos o direcciones de personas reales | Es un repo público: se indexa y se cosecha para spam |
| Volcados de base de datos, respaldos, capturas con datos reales | Filtran datos de usuarios |
| Tokens de GitHub, Vercel o cualquier servicio | Acceso directo a la infraestructura |

**En su lugar:** `.env.example` con valores claramente falsos (`postgres://user:password@host/db`), documentados en `02-stack.md`. Los valores reales viven en `.env.local` (ignorado por git) y en las variables de entorno de Vercel.

### Documentación sin datos personales
Los ejemplos en `docs/` usan datos inventados. Nada de horarios reales, correos reales ni nombres de profesores. El repo describe **cómo funciona la app**, no la vida de nadie.

### Si un secreto se filtra
Se rota **primero** y se limpia el historial después. Un secreto commiteado se considera comprometido desde ese instante, aunque el commit se borre: los repos públicos se clonan y se indexan en segundos.

1. Rotar la credencial en el servicio (Neon, Google, Vercel).
2. Reescribir el historial (`git filter-repo`) y forzar la actualización.
3. Anotarlo en `BITACORA.md`.

---

## 2. Protecciones activadas en GitHub

- **Secret scanning + push protection.** GitHub bloquea el push si detecta algo que parece una credencial. Es la última red de seguridad, no la primera.
- **Dependabot** para alertas de vulnerabilidades en dependencias.
- **CI obligatorio** (typecheck, lint, tests) antes de integrar a `main`.
- **`main` protegida:** sin `--force`, sin borrado.

---

## 3. Autenticación

- **Google OAuth** vía Auth.js v5. La app nunca ve ni guarda contraseñas: esa responsabilidad es de Google.
- **Sesiones en base de datos**, no solo JWT — permite cerrar sesión de verdad y revocar accesos.
- Cookies `httpOnly`, `secure`, `sameSite=lax`.
- Las **URLs de redirección autorizadas** se declaran en Google Cloud Console y son las únicas válidas. Que el código sea público no permite a nadie iniciar sesión como otra persona: falta el *client secret* y falta el control del dominio.
- `AUTH_SECRET` se genera con `openssl rand -base64 32` y es distinto entre local y producción.

---

## 4. Aislamiento entre usuarios

Es el riesgo número uno de la app: que un usuario vea los datos de otro. Tres capas, descritas en `03-arquitectura.md`:

1. `requireUser()` al inicio de **toda** consulta y **toda** Server Action.
2. Filtro por `user_id` en **toda** consulta. Sin excepciones.
3. Verificación de propiedad en cascada antes de escribir sobre un recurso hijo.

Además:
- Los IDs son `uuid`, no números consecutivos: no se puede adivinar el recurso de otra persona.
- Cuando un recurso no es del usuario se responde **404, no 403**. Un 403 confirmaría que el recurso existe.
- Hay pruebas E2E dedicadas: con dos usuarios de prueba se verifica que ninguno alcanza los datos del otro. Es la prueba que jamás se borra.

---

## 5. Validación de entrada

- **Toda** entrada se valida con Zod en el servidor, aunque ya se haya validado en el navegador. La validación del cliente es comodidad; la del servidor es seguridad.
- Drizzle usa consultas parametrizadas: sin concatenar SQL, sin inyección.
- React escapa el contenido por defecto. El markdown de las notas se sanitiza antes de renderizarse (nada de `dangerouslySetInnerHTML` sin limpiar).
- Límites de tamaño en todos los campos de texto, para evitar abuso de almacenamiento.

---

## 6. Datos personales

La app guarda información sensible en la práctica: horarios (dónde está una persona y a qué hora), faltas, y datos de salud como el peso corporal. Se trata con ese respeto.

- **Se guarda lo mínimo:** de Google solo se toman nombre, correo y foto.
- **Sin rastreo, sin anuncios, sin analítica de terceros.**
- **Exportar todo** a JSON desde Ajustes (Fase 11). Los datos son del usuario.
- **Borrar la cuenta** elimina todo de verdad, en cascada desde `users`.
- Conexión a la base de datos siempre por TLS; HTTPS obligatorio en producción.

---

## 7. Dependencias

- Se instala poco y a propósito: cada dependencia es superficie de ataque.
- Actualizaciones de seguridad primero; `npm audit` en CI.
- Sin paquetes sin mantenimiento ni con un solo autor desconocido para funciones que se pueden escribir en 20 líneas.

---

## 8. Revisión antes de cada push

Verificación rápida que corro yo antes de subir cualquier cosa:

```bash
git diff --cached                 # leer lo que realmente se va a subir
grep -rE "(secret|password|token|api[_-]?key)" --include="*.ts" src/
```

Y la pregunta de cierre: **¿hay aquí algo que no querría ver en la primera página de un buscador?** Si la respuesta no es un no rotundo, no se sube.
