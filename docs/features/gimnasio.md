# Funcionalidad · Gimnasio (rutinas, registro y progreso)

**Fases 6, 7 y 8 · Ramas `feat/gym-foundation`, `feat/gym-tracking`, `feat/gym-progress` · Estado: planeado**

> "Implementar una rutina de ejercicio ahí mismo para poder ver cómo voy mejorando/empeorando por el tiempo, ver mi rendimiento pues."

Dos verbos, y el segundo es el que importa: **registrar** y **ver el progreso**. Registrar es el medio; ver si uno mejora es el fin. Por eso el módulo se parte en tres fases: una para configurar, una para capturar sin fricción, y una entera dedicada a responder "¿voy mejorando?".

---

## Fase 6 · Catálogo y rutinas

### Qué debe poder hacer el usuario
1. Buscar entre ~60 ejercicios precargados en español.
2. Crear ejercicios propios.
3. Armar rutinas ("Push", "Pull", "Pierna") con sus ejercicios en orden.
4. Definir objetivos por ejercicio: series, rango de repeticiones, peso y descanso.
5. Reordenar, duplicar y archivar rutinas.

### Pantallas
- **`/gym/rutinas`** — lista de rutinas con número de ejercicios y última vez que se hizo.
- **`/gym/rutinas/[id]`** — editor: ejercicios en orden, cada uno con `4 × 8-12 · 60 kg · 90 s`.
- **`/gym/ejercicios`** — catálogo con búsqueda y filtro por grupo muscular.

### Reglas
- Los ejercicios precargados (`user_id NULL`) son de solo lectura; editarlos crea una copia personal.
- No se puede borrar un ejercicio con historial: se archiva (`ON DELETE RESTRICT`).
- El `tracking_type` decide qué campos se piden al registrar: peso×reps, solo reps, tiempo, o distancia+tiempo.

---

## Fase 7 · Registrar entrenamiento

**La pantalla más importante del módulo.** Se usa de pie, con una mano, con el celular en el bolsillo entre series, a veces sin señal. Si es incómoda, el usuario deja de registrar y todo el módulo se vuelve inútil.

### Flujo
```
/gym → "Entrenar"
   → elegir rutina (o entrenamiento libre)
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
- **Récord personal en vivo:** si la serie supera el mejor 1RM estimado del ejercicio, se marca en el momento. Es la recompensa inmediata que hace que valga la pena registrar.
- **Calentamiento** marcable, y excluido de todas las estadísticas.
- **Series extra o menos** de las planeadas: siempre permitido, la rutina es una guía, no una regla.
- **Sesión en curso** (`ended_at NULL`) sobrevive si se cierra la app; al volver se retoma donde iba.

### Otras pantallas
- **`/gym`** — inicio: sesión en curso o botón de entrenar, últimos entrenamientos, resumen de la semana.
- **`/gym/historial`** — sesiones pasadas, abribles para ver o corregir.
- **Peso corporal** — registro rápido desde el inicio del módulo.

### Casos borde
| Caso | Comportamiento |
|---|---|
| Sesión olvidada abierta | A las 6 horas se sugiere cerrarla con la hora de la última serie |
| Ejercicio sin historial | Campos vacíos con el objetivo de la rutina como sugerencia |
| Entrenamiento libre | Sin rutina; se agregan ejercicios sobre la marcha |
| Corregir una serie vieja | Editable desde el historial; las métricas se recalculan solas (ADR-006) |
| Sin señal en el gimnasio | Fase 7 requiere conexión; la escritura offline está en el backlog y se avisará con claridad |

---

## Fase 8 · Progreso

Aquí se responde la pregunta del usuario. Cada vista existe para eso, no para adornar.

### `/gym/progreso`

**1. Veredicto general** — arriba, en texto claro, sin gráfica:
> "Últimas 4 semanas: **subiendo**. Volumen +12% y 3 récords personales nuevos."

Se compara el promedio de las últimas 4 semanas contra las 4 anteriores, y se dice *subiendo*, *estable* o *bajando*. Es literalmente lo que pidió el cliente: ver si mejora o empeora.

**2. Progreso por ejercicio** — se elige un ejercicio y se ve su línea de **1RM estimado** en el tiempo (Epley: `peso × (1 + reps/30)`), que es la métrica honesta de fuerza porque compara 100 kg × 5 reps con 80 kg × 12 reps. Con su mejor marca y su tendencia.

**3. Volumen semanal** — barras de kilos totales movidos por semana, con desglose por grupo muscular. Muestra la carga real de trabajo.

**4. Récords personales** — tabla de mejor peso y mejor 1RM estimado por ejercicio, con la fecha.

**5. Constancia** — puntos por semana con racha actual y mejor racha. El progreso físico depende más de la constancia que de cualquier otra cosa, así que se muestra al mismo nivel que la fuerza.

**6. Peso corporal** — línea en el tiempo, opcionalmente sobrepuesta al volumen para ver la relación.

### Métricas y fórmulas
Definidas en `04-modelo-de-datos.md`. Todas calculadas en SQL desde `workout_sets`, nunca almacenadas (ADR-006). Las series de calentamiento se excluyen de todo.

### Lógica que se prueba con tests
- 1RM estimado (Epley) en casos conocidos, incluido 1 repetición.
- Agregación de volumen semanal respetando el inicio de semana del usuario.
- Detección de récord personal, incluyendo empates.
- Cálculo de racha con semanas saltadas.
- Comparación de tendencia con historial insuficiente (menos de 8 semanas) → se dice "aún no hay datos suficientes" en vez de inventar un veredicto.

---

## Fuera de alcance

Nutrición y calorías · rutinas prearmadas tipo PPL · videos de técnica · comparar con otras personas · integración con relojes o wearables · periodización automática. Todo al backlog.

## Preguntas abiertas para el cliente

- ¿Kilogramos o libras? (el diseño asume kg; se puede hacer configurable)
- ¿Haces cardio o solo pesas? (define si la vista de progreso incluye distancia y tiempo)
- ¿Quieres registrar RPE — qué tan pesada se sintió cada serie del 1 al 10 — o es demasiado al momento de capturar?
- ¿Quieres registrar tu peso corporal, o solo lo que levantas?
