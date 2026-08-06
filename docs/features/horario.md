# Funcionalidad · Horario escolar

**Fase 2 · Rama `feat/class-schedule` · Estado: planeado**

> "Poder meter mi horario escolar."

Es la base del resto de la app: las materias que se definen aquí son a las que después se les cuelgan tareas y exámenes.

---

## Qué debe poder hacer el usuario

1. Crear un semestre (nombre, fecha de inicio y fin).
2. Agregar materias: nombre, clave, profesor, salón, color y créditos.
3. Agregar a cada materia sus bloques de clase (día de la semana, hora de inicio y fin, salón si difiere).
4. Ver su semana completa en una cuadrícula.
5. Ver solo el día de hoy, y saber qué clase tiene ahora y cuál sigue.
6. Editar o borrar materias y bloques.
7. Archivar el semestre al terminarlo y empezar uno nuevo sin perder el anterior.

## Pantallas

### `/horario` — vista principal

**Escritorio:** cuadrícula semanal. Columnas = días con clase (los días vacíos no se muestran, no tiene caso ocupar espacio). Filas = horas, desde la primera clase hasta la última del usuario, no de 0 a 24. Cada bloque muestra materia, hora, salón, en el color de la materia. La franja de la hora actual se marca con una línea sutil.

**Móvil:** un día a la vez, deslizable en horizontal, con la fecha arriba y puntos de navegación. Abre siempre en hoy (o en lunes si es fin de semana). Lista vertical de bloques, con la clase actual resaltada.

### `/materias` — administración
Lista de materias del semestre activo. Cada una con su color, número de bloques y número de tareas pendientes. Botón para agregar.

### `/materias/[id]` — detalle
Datos de la materia, sus bloques de horario, y sus tareas pendientes (a partir de la Fase 3).

### Widget "clase actual / siguiente"
Aparece en el dashboard y arriba del horario en móvil. Tres estados:
- **En clase:** "Cálculo · Salón 204 · termina en 35 min"
- **Entre clases:** "Sigue: Álgebra · 11:00 · Salón 310 · en 40 min"
- **Sin más clases:** "Ya no tienes clases hoy"

---

## Reglas de negocio

- Un semestre activo a la vez por usuario. Activar otro archiva el anterior automáticamente.
- `end_time` debe ser posterior a `start_time`.
- **Traslapes:** al guardar un bloque que choca con otro existente se avisa con claridad ("Se encima con Álgebra, lunes 7:00–9:00"). No se bloquea el guardado — puede haber casos legítimos, y decidir por el usuario sería presuntuoso.
- Al borrar una materia se advierte cuántas tareas se irán con ella.
- Los colores se sugieren rotando la paleta para que dos materias no salgan iguales por defecto.
- Una materia sin bloques es válida (por ejemplo, una asignatura en línea).

## Casos borde

| Caso | Comportamiento |
|---|---|
| Clase que cruza la medianoche | No se soporta; se pide capturarla como dos bloques. Irrelevante para un horario universitario. |
| Materia con distinto salón por día | El bloque tiene su propio campo de salón, que gana sobre el de la materia. |
| Fin de semana sin clases | La vista de día muestra estado vacío; la semanal omite esos días. |
| Semestre sin materias | Estado vacío con botón "Agrega tu primera materia". |
| Fuera del rango del semestre | El horario se sigue mostrando, con un aviso discreto de que el semestre ya terminó. |

## Lógica que se prueba con tests

En `features/schedule/lib.ts` (Vitest):
- Detección de traslape entre dos bloques del mismo día.
- Cálculo de la clase actual y la siguiente dada una hora.
- Agrupación y ordenamiento de bloques por día.
- Cálculo del rango horario visible de la cuadrícula.
- Minutos restantes de la clase en curso.

## Fuera de alcance en esta fase

Importar el horario desde un PDF · excepciones por día ("esta semana no hay clase") · sincronización con Google Calendar · recordatorios antes de cada clase. Todo va al backlog del roadmap.

## Preguntas abiertas para el cliente

- ¿Tu horario cambia de semana a semana o es fijo? (el diseño asume fijo)
- ¿Tienes clases en sábado?
- ¿Quieres registrar créditos por materia, o sobra ese campo?
