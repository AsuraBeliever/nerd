# Funcionalidad · Dashboard "Hoy"

**Fase 5 · Rama `feat/dashboard` · Estado: planeado**

> "Esta app en sí es una forma de organizar mis ideas, y mi vida en sí."

Es la pantalla que se abre al entrar. Su único trabajo: que el usuario sepa **qué hacer ahora** sin tocar nada. Todo lo que no ayude a eso, no va aquí.

Va en la Fase 5 —después de horario, tareas y pendientes— porque un resumen solo se puede diseñar bien cuando ya existe lo que resume.

---

## Contenido, en orden

### 1. Encabezado
Saludo breve y la fecha. "Miércoles 5 de agosto".

### 2. Clase actual o siguiente
El widget del módulo de horario. Lo más urgente en la vida de un estudiante a media semana.
> **En clase ahora** · Cálculo Diferencial · Salón 204 · termina en 35 min

### 3. Clases de hoy
Lista compacta de los bloques del día, con las ya pasadas atenuadas y la actual resaltada.

### 4. Vence pronto
Tareas y exámenes de los próximos 7 días, máximo 5, con las vencidas siempre primero. Completables desde aquí sin salir de la pantalla.

### 5. Pendientes de hoy
Pendientes personales con fecha de hoy o vencidos. Aquí es donde lo escolar y lo personal por fin se juntan — separados en su sección, unidos en el día.

### 6. Gimnasio
Un renglón según el caso:
- Sesión en curso → botón para continuar
- Entrenó hoy → resumen breve
- No ha entrenado → "Último entrenamiento: hace 2 días · Racha: 3 semanas"

### 7. Vista rápida de la semana
Miniatura del horario semanal, tocable para ir al horario completo. Solo en escritorio.

---

## Reglas

- **Nada de secciones vacías.** Si no hay pendientes de hoy, esa sección no aparece; no se muestra "0 pendientes".
- **Todo es accionable.** Cada elemento se puede completar o abrir desde aquí.
- **Máximo 5 elementos por sección**, con enlace a "ver todo". El dashboard resume, no lista.
- **Después de las 8 pm** la sección de vencimientos cambia a "mañana" — a esa hora ya interesa el día siguiente.
- **Día completamente libre:** mensaje limpio ("No tienes nada pendiente hoy") en vez de secciones vacías. Es información valiosa, no un error.

## Casos borde

| Caso | Comportamiento |
|---|---|
| Usuario nuevo sin nada | Guía de tres pasos: crear semestre → agregar materias → agregar horario |
| Fin de semana | Se omiten las clases; se muestran tareas, pendientes y gimnasio |
| Todo al día | Estado positivo, sin secciones vacías |
| Vacaciones (fuera del semestre) | Se ocultan clases; se conservan pendientes y gimnasio |

## Rendimiento

Es la pantalla más visitada: debe cargar en un solo viaje. Las consultas del dashboard se agrupan en `features/dashboard/queries.ts` y se ejecutan en paralelo desde un Server Component. Objetivo: contenido visible en menos de 1 segundo en 4G.

## Preguntas abiertas para el cliente

- ¿Quieres que la app abra en el dashboard o directo en el horario?
- ¿Qué te gustaría ver primero al abrirla en la mañana?
