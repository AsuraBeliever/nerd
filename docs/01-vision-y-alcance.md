# 01 · Visión y alcance

## El problema

La información de la vida del usuario está dispersa: el horario en una foto o en un PDF de la escuela, las tareas en la cabeza o en apps de mensajería, los pendientes personales en notas sueltas, y el progreso del gimnasio en ningún lado. El costo no es solo olvidar cosas — es no poder **ver** cómo va uno.

## La visión

> Una sola app donde vive la estructura de mi vida: qué clase tengo ahora, qué debo entregar esta semana, qué pendientes traigo, y cómo voy en el gimnasio.

Dos ideas guían el producto:

1. **Organizar** — capturar la información con la menor fricción posible.
2. **Ver progreso** — no solo listas, sino la respuesta a "¿voy mejorando o empeorando?". Esto aplica al gimnasio de forma obvia, pero también a lo académico (¿estoy entregando a tiempo? ¿cuánto se me acumula?).

## Objetivos

| # | Objetivo | Cómo se sabe que se logró |
|---|---|---|
| 1 | Ver mi horario de clases al instante | Abro la app y sé qué clase sigue, en qué salón, en menos de 3 segundos |
| 2 | Nada se me pasa | Toda tarea/examen tiene fecha y se ve lo que vence pronto sin buscarlo |
| 3 | Separar escuela de vida personal | Los pendientes generales no se mezclan con los de materias, pero conviven en la misma vista de "hoy" |
| 4 | Registrar el gym sin batallar | Anotar una serie toma menos de 5 segundos desde el celular |
| 5 | Ver mi progreso físico | Gráficas de peso levantado, volumen y récords personales a lo largo del tiempo |
| 6 | Que se sienta ligera | Interfaz minimalista, carga rápida, sin ruido visual |

## Usuarios

- **Principal:** el usuario (estudiante universitario).
- **Secundarios:** cualquier persona con cuenta de Google. La app es multiusuario desde el inicio: cada quien ve solo sus datos, sin excepción.

## Alcance de la v1

Todo lo siguiente entra en la primera versión completa:

### Horario escolar
Materias del semestre con sus bloques de clase (día, hora, salón, profesor). Vista de semana y vista de "hoy". Color por materia.

### Académico
Tareas, exámenes, proyectos y lecturas ligados a una materia. Fecha de entrega, prioridad, estado, notas. Vistas por materia, por fecha y "lo que vence pronto".

### Pendientes generales
To-do list independiente de la escuela. Mismo motor que las tareas académicas, pero sin materia asociada — se ven por separado y también se integran en la vista de "hoy".

### Gimnasio
Catálogo de ejercicios, rutinas configurables, registro de sesiones (series, repeticiones, peso), y análisis de progreso: volumen por semana, 1RM estimado por ejercicio, récords personales, racha de asistencia.

### Transversal
Login con Google · Dashboard de inicio · Responsive móvil y escritorio · PWA instalable con soporte offline · Modo claro y oscuro.

## Fuera de alcance (por ahora)

Se dejan fuera de forma consciente, para no diluir la v1. Se pueden retomar después, cada uno en su propia rama:

- Notificaciones push y recordatorios por correo
- Importar el horario desde un PDF de la universidad
- Sincronización con Google Calendar
- Calificaciones y cálculo de promedio
- Compartir horario o tareas con compañeros
- Registro de nutrición / calorías
- Técnica Pomodoro y seguimiento de tiempo de estudio
- App nativa (la PWA cubre la necesidad)

## Principios de producto

1. **Minimalismo real.** Si un elemento no ayuda a decidir algo, se va.
2. **Captura rápida.** Agregar información nunca debe requerir más de dos toques para llegar al formulario.
3. **La app responde preguntas, no muestra datos.** "¿Qué sigue?" y "¿cómo voy?" antes que tablas.
4. **Los datos son del usuario.** Exportables, sin bloqueo, sin anuncios, sin rastreo.
5. **Rápida en celular con mala señal.** Es una app que se usa entre clases y en el gimnasio.
