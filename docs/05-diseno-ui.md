# 05 · Sistema de diseño

El cliente pidió **minimalista**. Eso aquí no significa "vacío" ni "gris y aburrido": significa que **cada elemento en pantalla se ganó su lugar**.

## Principios

1. **El contenido es la interfaz.** Sin adornos, sin sombras decorativas, sin degradados. Bordes de 1px y espacio en blanco hacen el trabajo de separación.
2. **Un solo color de acento.** El color se reserva para dos cosas: la acción principal y la identidad de cada materia. Todo lo demás es escala de grises.
3. **Jerarquía por tamaño y peso, no por color.** Si hay que gritar con color para que algo se note, la jerarquía está mal.
4. **Espacio generoso.** Es más fácil leer una lista corta con aire que una densa.
5. **Movimiento mínimo y funcional.** Transiciones de 150–200 ms para cambios de estado. Nada que rebote, nada que distraiga.
6. **Estados vacíos con propósito.** Una lista vacía explica qué va ahí y ofrece el botón para empezar. Nunca una pantalla en blanco.

---

## Color

Escala neutra + un acento. Definidos como variables CSS en `globals.css`, con modo claro y oscuro.

```
Neutros    fondo · superficie · borde · texto sutil · texto secundario · texto principal
Acento     un solo tono (azul índigo) — botón primario, foco, elemento activo
Semántico  éxito (verde) · alerta (ámbar) · peligro (rojo)  ← solo para estado, nunca decorativos
```

**Paleta de materias** — 8 tonos suaves de saturación pareja, elegidos para distinguirse entre sí y ser legibles sobre fondo claro y oscuro:

`azul · esmeralda · ámbar · rosa · violeta · cian · naranja · lima`

Cada materia guarda su token (`"emerald"`), no un hex. Así el color se adapta solo al modo claro/oscuro y se puede cambiar la paleta entera sin migrar datos.

**El color semántico solo se usa en dos lugares**, porque ambos comunican riesgo real:

1. **Fechas de entrega** — vencida → rojo · hoy → ámbar · esta semana → texto normal · después → texto sutil.
2. **Asistencia** — quedan más de 3 faltas → neutro · quedan 2 o 3 → ámbar · queda 1 o ninguna → rojo.

En ningún otro lado. Si el color pierde su significado por usarse de adorno, deja de servir donde importa.

---

## Tipografía

Una sola familia: **Geist Sans** (vía `next/font`, sin petición externa). Números tabulares para tablas de peso/repeticiones, para que las columnas queden alineadas.

| Uso | Tamaño | Peso |
|---|---|---|
| Título de página | 24 px | 600 |
| Título de sección | 18 px | 600 |
| Cuerpo | 15 px | 400 |
| Secundario / metadatos | 13 px | 400 |
| Etiquetas y datos numéricos | 12 px | 500 |

Escala corta a propósito: cinco tamaños bastan y evitan que la app se vea inconsistente.

---

## Espaciado y forma

- Escala de 4 px: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.
- Radio de esquinas: `6 px` en controles, `10 px` en tarjetas. Nada completamente redondo salvo avatares.
- Ancho máximo de contenido: `1100 px`, centrado.
- Bordes: `1px` en color de borde neutro. **Sin sombras** salvo en elementos flotantes (modal, menú desplegable).

---

## Navegación

| Dispositivo | Patrón |
|---|---|
| **Escritorio** (≥1024px) | Barra lateral izquierda fija y angosta con iconos + texto |
| **Tableta** (768–1023px) | Barra lateral colapsada a iconos |
| **Móvil** (<768px) | Barra inferior con 5 destinos: Hoy · Horario · Tareas · Entrenar · Ajustes |

La asistencia no tiene destino propio en la barra: se registra desde el horario y el dashboard, donde el usuario ya está mirando sus clases. Su resumen vive dentro de cada materia y en `/asistencia`.

La barra inferior en móvil es deliberada: el pulgar llega ahí sin estirarse. Botón flotante de "agregar" arriba de la barra, contextual a la sección actual.

---

## Componentes base (shadcn/ui, desnudados)

`Button` `Input` `Textarea` `Select` `Checkbox` `Dialog` `Sheet` `DropdownMenu` `Popover` `Calendar` `Tabs` `Badge` `Card` `Toast` `Skeleton` `Separator`

Además, componentes propios del proyecto:

- **`ScheduleGrid`** — cuadrícula semanal del horario con bloques posicionados por hora.
- **`CourseBadge`** — punto de color + nombre de materia.
- **`TaskRow`** — casilla, título, materia, fecha con color de urgencia.
- **`DueDateLabel`** — fecha en lenguaje natural ("mañana", "en 3 días", "vencida hace 2 días").
- **`AttendanceMarks`** — tres botones grandes (asistí / falté / tarde) para marcar en un toque.
- **`AttendanceBar`** — barra de porcentaje con marca visible en el umbral mínimo y las faltas restantes como cifra principal.
- **`SetInput`** — entrada compacta de peso × repeticiones optimizada para el pulgar, con incrementos propios de la unidad elegida.
- **`ProgressChart`** — gráfica de línea sin cuadrícula ni bordes: solo la línea, los ejes y el punto activo.
- **`EmptyState`** — icono, una frase, un botón.
- **`StreakDots`** — visualización compacta de racha semanal.

---

## Puntos de quiebre

`sm 640 · md 768 · lg 1024 · xl 1280`

Móvil primero en el CSS: los estilos base son para celular y se amplían hacia arriba.

## Adaptaciones clave por dispositivo

| Vista | Móvil | Escritorio |
|---|---|---|
| Horario | Lista por día, deslizable entre días | Cuadrícula semanal completa |
| Asistencia | Botones de marcar dentro de cada clase del día | Resumen de todas las materias en tabla |
| Tareas | Lista compacta agrupada por fecha | Lista con columnas y filtros laterales |
| Entrenar | Una tarjeta de ejercicio a la vez, a pantalla completa | Todos los ejercicios visibles en columnas |
| Progreso | Gráficas apiladas | Rejilla de 2 columnas |

---

## Accesibilidad (no opcional)

- Contraste mínimo AA (4.5:1 en texto).
- Todo alcanzable con teclado; anillo de foco visible siempre.
- Áreas táctiles de al menos 44×44 px.
- Todo campo con etiqueta real (no solo `placeholder`).
- El color nunca es el único portador de información — siempre hay texto o icono acompañando.
- Respeta `prefers-reduced-motion`.

## Modo oscuro

Soportado desde el inicio, no agregado después: los tokens de color se definen en pares desde el día uno. Por defecto sigue la preferencia del sistema, con interruptor manual en Ajustes.
