# Funcionalidad · Tareas, exámenes y proyectos

**Fase 3 · Rama `feat/academic-tasks` · Estado: planeado**

> "Poder poner en cada materia mis tareas / exámenes / pendientes."

---

## Qué debe poder hacer el usuario

1. Agregar una tarea a una materia, en menos de 15 segundos.
2. Clasificarla: tarea, examen, proyecto o lectura.
3. Ponerle fecha de entrega, con hora o solo fecha.
4. Darle prioridad (baja, media, alta).
5. Escribir notas y dividirla en subtareas.
6. Marcarla como hecha (y poder deshacerlo).
7. Ver todo lo de una materia.
8. Ver **todo lo que vence pronto**, sin importar la materia.
9. Filtrar por materia, tipo, estado y prioridad.

## Pantallas

### `/tareas` — vista principal
Agrupada por urgencia, en este orden:

```
Vencidas          (rojo, siempre hasta arriba)
Hoy
Mañana
Esta semana
Después
Sin fecha
```

Cada renglón: casilla · título · punto de color de la materia · etiqueta del tipo · fecha en lenguaje natural. Un toque abre el detalle; la casilla completa sin abrir nada.

Filtros arriba (materia, tipo) y un interruptor para mostrar completadas.

### `/materias/[id]` — pestaña de tareas
Las tareas de esa materia: pendientes arriba, completadas colapsadas abajo con contador.

### Detalle de tarea
Hoja inferior en móvil, modal en escritorio. Título editable en línea, materia, tipo, fecha, prioridad, notas (markdown), subtareas con barra de progreso, y borrar.

### Captura rápida
Botón flotante en móvil, `Ctrl/Cmd + K` en escritorio. Un solo campo de texto: escribes el título, eliges materia y fecha, y listo. Todo lo demás es opcional.

---

## Reglas de negocio

- La materia es opcional en el modelo (`course_id NULL` = pendiente personal, Fase 4), pero en esta pantalla siempre se pide.
- Sin hora (`has_time = false`) se muestra solo la fecha; con hora se muestra "vie 21 · 7:00 pm".
- Al completar: se guarda `completed_at`, la tarea se desvanece de la lista y aparece un aviso con **Deshacer** durante 5 segundos.
- Una tarea vencida no se oculta ni se archiva sola: sigue arriba hasta que el usuario la resuelva.
- Los exámenes se distinguen visualmente del resto — pesan más.
- Al completar todas las subtareas se sugiere marcar la tarea completa, pero no se hace automáticamente.

## Colores de urgencia

| Situación | Tratamiento |
|---|---|
| Vencida | Rojo, con "hace N días" |
| Hoy | Ámbar |
| Mañana / esta semana | Texto normal |
| Después | Texto sutil |
| Sin fecha | Texto sutil, al final |

Es el único uso de color semántico en las listas. Sostiene el objetivo #2 del proyecto: que nada se pase.

## Casos borde

| Caso | Comportamiento |
|---|---|
| Tarea sin fecha | Va al grupo "Sin fecha", nunca se marca vencida |
| Se borra la materia | Se advierte cuántas tareas se irán y se confirma |
| Fecha en el pasado al crearla | Se permite (capturar algo atrasado es legítimo), con aviso |
| Muchas tareas | Se cargan de a 50 con desplazamiento infinito |
| Semestre archivado | Sus tareas quedan en el historial, fuera de las vistas activas |

## Lógica que se prueba con tests

- Agrupación por urgencia respetando la zona horaria del usuario.
- Fechas en lenguaje natural ("hoy", "mañana", "en 3 días", "hace 2 días").
- Orden dentro de cada grupo (prioridad, luego hora, luego creación).
- Cálculo de progreso de subtareas.

## Fuera de alcance en esta fase

Tareas recurrentes · adjuntar archivos · recordatorios push · calificaciones y promedio · estimación de tiempo. Al backlog.

## Preguntas abiertas para el cliente

- ¿Te sirve un tipo "lectura", o con tarea/examen/proyecto basta?
- Al completar una tarea, ¿prefieres que desaparezca o que se quede tachada un rato?
- ¿Quieres registrar la calificación obtenida en cada tarea/examen? (definiría si adelantamos el módulo de calificaciones)
