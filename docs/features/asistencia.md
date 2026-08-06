# Funcionalidad · Asistencia y faltas

**Fase 3 · Rama `feat/attendance` · Estado: planeado**

> "Me interesa registrar faltas y poner cuál es el límite en términos de porcentaje, o sea cuál es el mínimo de asistencias. En mi caso es 80%, pero igual déjalo a libre elección."

La app no solo debe contar faltas: debe responder **"¿cuántas faltas me quedan antes de reprobar por inasistencia?"**. Esa es la pregunta real, y es la que se muestra más grande que cualquier otra cosa en esta sección.

---

## Qué debe poder hacer el usuario

1. Marcar su asistencia del día con un toque, desde el horario o el dashboard.
2. Registrar cuatro estados: **asistí · falté · llegué tarde · justificada**.
3. Definir el **porcentaje mínimo de asistencia** — global y por materia.
4. Ver, por materia: porcentaje actual, faltas acumuladas y **faltas restantes**.
5. Marcar una clase como **cancelada** (no cuenta ni a favor ni en contra).
6. Registrar asistencia de días pasados que se le olvidaron.
7. Ver el historial de faltas de cada materia.

---

## El cálculo

Tres números, y el tercero es el que importa:

```
Sesiones consideradas  = clases transcurridas − canceladas
Porcentaje actual      = (asistencias + justificadas) / sesiones consideradas
Faltas máximas         = ⌊ sesiones totales del semestre × (1 − mínimo requerido) ⌋
Faltas restantes       = faltas máximas − faltas acumuladas
```

**Sesiones totales del semestre** se calculan solas: número de bloques semanales de la materia × semanas entre el inicio y el fin del semestre. El usuario puede sobrescribir el número si su universidad maneja otro (campo `expected_sessions_override`).

**Ejemplo con el caso real del cliente:** materia con 2 clases por semana, semestre de 16 semanas = 32 sesiones. Mínimo 80% → puede faltar a 6 (`⌊32 × 0.20⌋`). Si lleva 2 faltas, la app dice: **"Te quedan 4 faltas"**.

### Todo es configurable — con los valores por defecto del cliente

| Ajuste | Por defecto | Rango |
|---|---|---|
| **Mínimo global** | 80% | cualquier valor de 0 a 100 |
| **Mínimo por materia** | hereda el global | propio por materia; le gana al global |
| **¿Las justificadas cuentan como asistencia?** | **Sí** | interruptor |
| **¿Se registran retardos?** | **No** | interruptor; al apagarlo, el botón "Tarde" no aparece |
| **¿Cuántos retardos hacen una falta?** | — | 2, 3, 4… cuando los retardos están activados |

Los valores por defecto salen de la escuela del cliente: *"las justificaciones sí cuentan como asistencias, no existen retardos, o tienes asistencia o no"*. Pero fue explícito en que quedara libre — así que **son defaults, no reglas**. Alguien cuya escuela no acepte justificantes, o que maneje "3 retardos = 1 falta", lo cambia en Ajustes sin tocar el código (ADR-012).

Consecuencia de diseño: con la configuración del cliente, la pantalla de registro muestra **dos botones** (asistí / falté), no tres. La interfaz se encoge cuando el usuario apaga cosas — no se queda con opciones muertas.

---

## Pantallas

### Registro rápido (en el horario y en el dashboard)
Cada clase del día trae botones grandes: **✓ Asistí · ✗ Falté**, y **⏱ Tarde** solo si el usuario activó los retardos. Un toque y listo, sin abrir nada. Marcar como justificada y cancelada se hace desde el detalle, que son casos menos frecuentes.

Después de que termina una clase sin registro, aparece un recordatorio discreto en el dashboard: *"¿Fuiste a Cálculo hoy?"* con los mismos botones. Sin regaños ni insistencia; si se ignora, queda sin registrar y se puede llenar después.

### `/materias/[id]` — pestaña de asistencia
Lo más grande de la pantalla es la cifra que importa:

```
      Te quedan 4 faltas
   ████████████░░░  87.5%   ·   mínimo 80%
   28 clases · 24 asistencias · 2 faltas · 2 retardos
```

Barra con marca visible en el umbral mínimo, para que se vea de un vistazo qué tan cerca del límite está. Abajo, el historial por fecha, editable.

### `/asistencia` — resumen general
Todas las materias del semestre, ordenadas por riesgo: primero las que están más cerca del límite. Cada renglón con su porcentaje, sus faltas restantes y su semáforo.

---

## Semáforo

| Estado | Cuándo | Color |
|---|---|---|
| **Holgado** | quedan más de 3 faltas | neutro |
| **Cuidado** | quedan 2 o 3 faltas | ámbar |
| **Al límite** | queda 1 o ninguna | rojo |
| **Rebasado** | ya está por debajo del mínimo | rojo, con el dato de cuántas faltas se pasó |

Es el segundo uso de color semántico de la app, junto con las fechas de entrega. Ambos comunican riesgo real, no decoración.

---

## Reglas de negocio

- La asistencia se registra **por bloque de clase**, no por día: si una materia se ve dos veces el lunes, son dos registros.
- Solo se pueden registrar clases **ya transcurridas**. Nada de marcar asistencia el domingo para el lunes.
- Las clases **canceladas** salen del denominador por completo.
- Sin registro ≠ falta. Un día sin marcar simplemente no cuenta hasta que el usuario lo llene. Asumir falta sería injusto y arruinaría los números.
- Cambiar el mínimo de una materia recalcula todo al instante (no hay nada guardado precalculado).
- Si el semestre no tiene fechas de inicio y fin, no se pueden estimar las sesiones totales: se muestra el porcentaje actual pero no las faltas restantes, y se invita a completar las fechas.

## Casos borde

| Caso | Comportamiento |
|---|---|
| Materia sin bloques de horario (en línea) | Registro manual de sesiones, sin estimación automática |
| Se agregó la materia a medio semestre | Se puede fijar manualmente el total de sesiones |
| Días festivos | Se marcan como cancelados, en todas las materias de ese día de una vez |
| Ya rebasó el mínimo | Se dice claro y sin dramatismo, con cuántas faltas se pasó |
| Semestre archivado | Los registros se conservan como historial |

## Lógica que se prueba con tests

En `features/attendance/lib.ts` (Vitest):
- Cálculo del porcentaje con y sin justificadas contando.
- Estimación de sesiones totales del semestre a partir de bloques y fechas.
- Faltas máximas y restantes (incluido el redondeo hacia abajo).
- Conversión de retardos a faltas con la regla configurable.
- Exclusión de clases canceladas del denominador.
- Umbral del semáforo en los bordes exactos.

## Fuera de alcance en esta fase

Detección automática de asistencia por ubicación · justificantes con archivo adjunto · notificación al acercarse al límite (llega con el módulo de notificaciones) · importar días festivos del calendario escolar.

## Respuestas del cliente (sesión 3)

- **Las justificadas sí cuentan como asistencia** → `excused_counts_as_present = true` por defecto.
- **No existen los retardos**: *"o tienes asistencia o no"* → `track_lates = false` por defecto, y el botón "Tarde" no se muestra.
- Ambas quedan configurables, por petición explícita suya.
