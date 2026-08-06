# Funcionalidad · Pendientes generales (to-do list)

**Fase 4 · Rama `feat/personal-todos` · Estado: planeado**

> "Poder poner aparte los pendientes que tengo, tipo una to-do list."

La palabra clave es **aparte**: lo personal no debe ahogarse entre lo escolar. Pero tampoco debe vivir en una isla — en la vista de "hoy" ambos aparecen juntos, porque el día del usuario es uno solo.

---

## Cómo se logra "aparte" sin duplicar todo

Por debajo son la misma tabla `tasks`, con `course_id = NULL` (ver ADR-004). La separación ocurre en la interfaz: sección propia, navegación propia, y las tareas escolares nunca aparecen aquí ni viceversa. El usuario percibe dos listas independientes; el código mantiene una sola.

Gracias a eso, esta fase es corta: reutiliza el formulario, la lógica de fechas, las subtareas y el completar con deshacer de la Fase 3.

---

## Qué debe poder hacer el usuario

1. Agregar un pendiente escribiendo solo el título.
2. Ponerle fecha y prioridad si quiere (todo opcional).
3. Reordenar arrastrando.
4. Completarlo, con deshacer.
5. Ver sus pendientes agrupados por cuándo tocan.
6. Agregar subtareas.

## Pantalla `/pendientes`

Campo de captura permanente hasta arriba: escribir + Enter crea el pendiente sin abrir nada. Cero fricción — es la diferencia entre usar la lista y no usarla.

Grupos:

```
Vencidos
Hoy
Esta semana
Después
Sin fecha        ← aquí caerá la mayoría, y está bien
Completados      ← colapsado, con contador
```

Dentro de "Sin fecha" el orden es manual, arrastrando. En los grupos con fecha manda la fecha.

## Reglas de negocio

- Todo es opcional salvo el título. Un pendiente puede ser solo cuatro palabras.
- Nunca se pide materia: si algo pertenece a una materia, va en Tareas.
- El orden manual (`sort_order`) solo aplica a los pendientes sin fecha.
- Los completados se ocultan a los 7 días, pero no se borran.
- Los pendientes de hoy y los vencidos aparecen también en el dashboard.

## Casos borde

| Caso | Comportamiento |
|---|---|
| Lista vacía | Estado vacío con el campo de captura enfocado |
| Muchos pendientes sin fecha | Desplazamiento infinito; se sugiere agrupar o poner fechas |
| Arrastrar en móvil | Manija de arrastre explícita, para no pelear con el desplazamiento |
| Convertir en tarea escolar | Desde el detalle se le puede asignar una materia y se mueve solo a Tareas |

## Lógica que se prueba con tests

- Reordenamiento y recálculo de `sort_order` sin colisiones.
- Que las consultas de pendientes personales **nunca** devuelvan tareas con materia (y viceversa) — es la prueba que protege la decisión ADR-004.

## Preguntas abiertas para el cliente

- ¿Quieres categorías o etiquetas para los pendientes personales (casa, trámites, compras), o prefieres una sola lista limpia?
- ¿Pendientes que se repiten (pagar renta cada mes)? Hoy está fuera de alcance.
