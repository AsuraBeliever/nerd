# Funcionalidad · Entrenamiento (casa o gimnasio)

**Fases 8, 9 y 10 · Ramas `feat/training-foundation`, `feat/training-tracking`, `feat/training-progress` · Estado: planeado**

> "Implementar una rutina de ejercicio ahí mismo para poder ver cómo voy mejorando/empeorando por el tiempo, ver mi rendimiento pues."
>
> "Yo actualmente solo hago cosas desde casa."

Dos verbos, y el segundo es el que importa: **registrar** y **ver el progreso**. Registrar es el medio; saber si uno mejora es el fin. Por eso el módulo se parte en tres fases: una para configurar, una para capturar sin fricción, y una entera dedicada a responder "¿voy mejorando?".

## Entrenar en casa es el caso principal

El cliente entrena en casa, así que el módulo se diseña para **peso corporal, mancuernas y bandas** en primer lugar, y para gimnasio como caso igualmente válido. Esto no es un detalle de catálogo: cambia cómo se mide el progreso, porque en casa muchas veces **no hay peso que subir** — se progresa haciendo más repeticiones, más series, mejor control o variantes más difíciles. Una app que solo grafica kilos sería inútil para alguien que hace lagartijas.

Consecuencias concretas:
- El catálogo precargado trae ~35 ejercicios de casa (peso corporal, mancuerna, banda) además de los de gimnasio.
- En Ajustes se elige el **equipo disponible**, y el catálogo se filtra solo. Quien entrena en casa no ve prensa de piernas.
- Cada ejercicio tiene su **forma de medir**: peso×reps, solo reps, tiempo (plancha), o distancia+tiempo.
- El progreso de los ejercicios sin peso se mide por **repeticiones y volumen**, no por 1RM. Detalle en la Fase 10.
- Se puede registrar **peso añadido** (mochila, chaleco, banda) en ejercicios de peso corporal, y cuenta para el progreso.

## Kilos o libras — a elección del usuario

Ajuste por usuario. Internamente **todo se guarda siempre en kilogramos** y se convierte solo al mostrar y al capturar (ADR-011). Así, cambiar de unidad a media historia no rompe ni una gráfica ni un récord: los mismos datos se ven en otra unidad, sin conversiones acumuladas ni errores de redondeo.

---

## Fase 8 · Catálogo y rutinas
**Rama `feat/training-foundation`**

### Qué debe poder hacer el usuario
1. Elegir su equipo disponible y ver solo ejercicios que puede hacer.
2. Buscar entre el catálogo precargado en español (casa + gimnasio).
3. Crear ejercicios propios.
4. Armar rutinas ("Torso", "Pierna", "Full body en casa") con sus ejercicios en orden.
5. Definir objetivos por ejercicio: series, rango de repeticiones, peso o tiempo, y descanso.
6. Reordenar, duplicar y archivar rutinas.

### Pantallas
- **`/entrenamiento/rutinas`** — lista de rutinas con número de ejercicios y última vez que se hizo.
- **`/entrenamiento/rutinas/[id]`** — editor: ejercicios en orden, cada uno con `4 × 8-12 · 20 kg · 90 s`.
- **`/entrenamiento/ejercicios`** — catálogo con búsqueda, filtro por grupo muscular y por equipo.

### Reglas
- Los ejercicios precargados (`user_id NULL`) son de solo lectura; editarlos crea una copia personal.
- No se puede borrar un ejercicio con historial: se archiva (`ON DELETE RESTRICT`).
- El `tracking_type` decide qué campos se piden al registrar.
- El filtro de equipo oculta, no borra: si algún día el usuario se inscribe a un gimnasio, activa el equipo y aparece todo.

---

## Fase 9 · Registrar entrenamiento
**Rama `feat/training-tracking`**

**La pantalla más importante del módulo.** Se usa de pie, con una mano, sudando, entre series. Si es incómoda, el usuario deja de registrar y todo el módulo se vuelve inútil.

### Flujo
```
/entrenamiento → "Entrenar"
   → elegir rutina (o sesión libre)
   → sesión abierta: ejercicio por ejercicio
       · cada serie precargada con lo de la última vez
       · ajustar peso/reps con + / − o teclado numérico
       · ✓ registra la serie e inicia el descanso
   → "Terminar" → resumen de la sesión
```

### Detalles que hacen la diferencia
- **Precarga inteligente:** al abrir un ejercicio ya aparecen el peso y las reps de la última sesión. La mayoría de las veces solo hay que confirmar.
- **Actualización optimista:** la serie se ve registrada al instante; si falla la red, se revierte con aviso.
- **Temporizador de descanso** automático al completar una serie, con el tiempo objetivo de la rutina.
- **Récord personal en vivo:** si la serie supera la mejor marca del ejercicio —más peso, o más repeticiones al mismo peso— se marca en el momento. Es la recompensa inmediata que hace que valga la pena registrar.
- **Calentamiento** marcable, y excluido de todas las estadísticas.
- **Series extra o menos** de las planeadas: siempre permitido. La rutina es una guía, no una regla.
- **Sesión en curso** (`ended_at NULL`) sobrevive si se cierra la app; al volver se retoma donde iba.
- **Unidad respetada en todo momento:** los botones de + / − suben de 2.5 en 2.5 en kg y de 5 en 5 en libras, porque así vienen los discos y las mancuernas.

### Otras pantallas
- **`/entrenamiento`** — inicio: sesión en curso o botón de entrenar, últimas sesiones, resumen de la semana.
- **`/entrenamiento/historial`** — sesiones pasadas, abribles para ver o corregir.
- **Peso corporal** — registro rápido desde el inicio del módulo, en la unidad elegida.

### Casos borde
| Caso | Comportamiento |
|---|---|
| Sesión olvidada abierta | A las 6 horas se sugiere cerrarla con la hora de la última serie |
| Ejercicio sin historial | Campos vacíos con el objetivo de la rutina como sugerencia |
| Sesión libre | Sin rutina; se agregan ejercicios sobre la marcha |
| Corregir una serie vieja | Editable desde el historial; las métricas se recalculan solas (ADR-006) |
| Ejercicio de peso corporal | No pide peso; opcionalmente acepta peso añadido |
| Sin señal | Fase 9 requiere conexión; la escritura offline está en el backlog y se avisa con claridad |

---

## Fase 10 · Progreso
**Rama `feat/training-progress`**

Aquí se responde la pregunta del cliente. Cada vista existe para eso, no para adornar.

### `/entrenamiento/progreso`

**1. Veredicto general** — arriba, en texto claro, sin gráfica:
> "Últimas 4 semanas: **subiendo**. Volumen +12% y 3 récords personales nuevos."

Se compara el promedio de las últimas 4 semanas contra las 4 anteriores y se dice *subiendo*, *estable* o *bajando*. Es literalmente lo que pidió el cliente: saber si mejora o empeora.

**2. Progreso por ejercicio** — se elige un ejercicio y se ve su línea en el tiempo. **Qué se grafica depende del tipo de ejercicio:**

| Tipo | Métrica de progreso |
|---|---|
| Con peso (`weight_reps`) | **1RM estimado** — Epley: `peso × (1 + reps/30)`. Compara honestamente 100 kg × 5 con 80 kg × 12 |
| Peso corporal (`reps_only`) | **Mejor serie en repeticiones** y **repeticiones totales por sesión** |
| Peso corporal con peso añadido | 1RM estimado usando peso corporal + peso añadido |
| Tiempo (plancha) | **Mejor tiempo sostenido** |
| Distancia + tiempo | **Ritmo** (min/km) y distancia total |

Esto es lo que hace que el módulo sirva entrenando en casa. Alguien que pasó de 8 a 15 lagartijas progresó muchísimo, y la app tiene que decírselo.

**3. Volumen semanal** — barras del trabajo total por semana, con desglose por grupo muscular. Para ejercicios con peso, volumen = `reps × peso`. Para peso corporal, se usa el peso corporal registrado si existe; si no, se cuentan repeticiones (las dos escalas nunca se suman entre sí, se muestran por separado).

**4. Récords personales** — mejor marca por ejercicio, con su fecha, en la unidad elegida.

**5. Constancia** — puntos por semana con racha actual y mejor racha. El progreso físico depende más de la constancia que de cualquier otra cosa, así que se muestra al mismo nivel que la fuerza.

**6. Peso corporal** — línea en el tiempo, opcionalmente sobrepuesta al volumen para ver la relación.

### Lógica que se prueba con tests
- 1RM estimado (Epley) en casos conocidos, incluido 1 repetición.
- Conversión kg ↔ lb en ambos sentidos, sin pérdida al ida y vuelta.
- Progreso de ejercicios sin peso (mejor serie y repeticiones totales).
- Agregación de volumen semanal respetando el inicio de semana del usuario.
- Detección de récord personal, incluyendo empates y récords por repeticiones.
- Cálculo de racha con semanas saltadas.
- Tendencia con historial insuficiente (menos de 8 semanas) → dice "aún no hay datos suficientes" en vez de inventar un veredicto.

---

## Fuera de alcance

Nutrición y calorías · rutinas prearmadas tipo PPL · videos de técnica · comparar con otras personas · integración con relojes o wearables · periodización automática. Todo al backlog.

## Respuestas del cliente (sesión 3)

> "En casa puro cuerpo, hago ejercicios básicos, pero déjalo libre para que cualquier persona lo pueda usar aunque vaya al gym o lo que sea."

- **Equipo por defecto: `['bodyweight']`.** Al entrar, el catálogo muestra solo ejercicios de peso corporal. Nada de prensa de piernas ni poleas estorbando.
- **El catálogo completo se precarga de todos modos** — gimnasio incluido. No se recorta la base de datos: se filtra la vista. Activar mancuernas o un gimnasio entero desde Ajustes es un toque, sin migración ni pérdida de historial.
- **Ejercicios básicos primero:** las lagartijas, sentadillas, plancha, zancadas y abdominales son los que se ven al abrir la app, no escondidos tras una búsqueda.
- Esto refuerza por qué el progreso **no puede medirse solo en kilos** (ver arriba): con puro peso corporal, la única señal de mejora son las repeticiones, el tiempo sostenido y la dificultad de la variante.

### Sigue abierto
- ¿Haces algo de cardio, o solo fuerza?
- ¿Quieres registrar RPE — qué tan pesada se sintió cada serie del 1 al 10 — o estorba al capturar?
- ¿Te interesa registrar tu peso corporal? *(con puro peso corporal sirve doble: es la carga real de cada repetición)*
