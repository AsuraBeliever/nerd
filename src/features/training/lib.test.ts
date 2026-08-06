import { describe, expect, it } from "vitest";
import {
  currentStreak,
  estimatedOneRepMax,
  loadOf,
  personalRecord,
  progressSeries,
  type SetLike,
  volumeOf,
  volumeTrend,
  weekKey,
  weeklyVolume,
} from "./lib";
import { displayToKg, formatWeight, kgToDisplay, parseWeightInput, stepFor } from "./units";

const set = (over: Partial<SetLike> = {}): SetLike => ({
  exerciseId: "e1",
  reps: 10,
  weightKg: null,
  addedWeightKg: null,
  durationSeconds: null,
  distanceM: null,
  isWarmup: false,
  completedAt: new Date("2026-08-06T12:00:00Z"),
  ...over,
});

describe("unidades de peso", () => {
  it("convierte kilos a libras y de regreso sin perder el valor", () => {
    const kg = 100;
    expect(displayToKg(kgToDisplay(kg, "lb"), "lb")).toBeCloseTo(kg, 10);
  });

  it("en kilos no toca nada", () => {
    expect(kgToDisplay(22.5, "kg")).toBe(22.5);
    expect(displayToKg(22.5, "kg")).toBe(22.5);
  });

  it("formatea sin decimales cuando no hacen falta", () => {
    expect(formatWeight(100, "kg")).toBe("100 kg");
    expect(formatWeight(22.5, "kg")).toBe("22.5 kg");
    expect(formatWeight(null, "kg")).toBe("—");
  });

  it("usa incrementos que existen en el mundo real", () => {
    // Nada de "5.51 lb": los discos vienen de 2.5 kg o de 5 lb.
    expect(stepFor("kg")).toBe(2.5);
    expect(stepFor("lb")).toBe(5);
  });

  it("acepta coma decimal al capturar", () => {
    expect(parseWeightInput("22,5", "kg")).toBe(22.5);
  });

  it("rechaza lo que no es un peso", () => {
    expect(parseWeightInput("abc", "kg")).toBeNull();
    expect(parseWeightInput("-5", "kg")).toBeNull();
  });
});

describe("1RM estimado", () => {
  it("con una sola repetición es el peso mismo", () => {
    expect(estimatedOneRepMax(100, 1)).toBe(100);
  });

  it("aplica Epley", () => {
    expect(estimatedOneRepMax(100, 5)).toBeCloseTo(116.67, 1);
  });

  it("pone en la misma escala series que no se parecen", () => {
    // Es el punto de la fórmula: 100 × 5 y 80 × 12 son series distintas y
    // aun así se pueden comparar. Aquí gana la primera (116.7 contra 112).
    const pesado = estimatedOneRepMax(100, 5) ?? 0;
    const ligero = estimatedOneRepMax(80, 12) ?? 0;
    expect(pesado).toBeCloseTo(116.67, 1);
    expect(ligero).toBeCloseTo(112, 1);
    expect(pesado).toBeGreaterThan(ligero);
  });

  it("más repeticiones al mismo peso siempre es mejor marca", () => {
    const menos = estimatedOneRepMax(80, 8) ?? 0;
    const mas = estimatedOneRepMax(80, 12) ?? 0;
    expect(mas).toBeGreaterThan(menos);
  });

  it("sin carga o sin repeticiones no inventa", () => {
    expect(estimatedOneRepMax(0, 10)).toBeNull();
    expect(estimatedOneRepMax(100, 0)).toBeNull();
  });
});

describe("carga y volumen", () => {
  it("con peso corporal usa el peso del usuario si lo conoce", () => {
    expect(loadOf(set(), 70)).toBe(70);
  });

  it("suma el peso añadido al peso corporal", () => {
    expect(loadOf(set({ addedWeightKg: 10 }), 70)).toBe(80);
  });

  it("sin peso corporal registrado, no inventa una carga", () => {
    expect(loadOf(set(), null)).toBeNull();
  });

  it("el calentamiento no suma volumen", () => {
    expect(volumeOf(set({ weightKg: 100, isWarmup: true }), null)).toBe(0);
  });

  it("volumen es repeticiones por carga", () => {
    expect(volumeOf(set({ reps: 10, weightKg: 50 }), null)).toBe(500);
  });
});

describe("progreso según el tipo de ejercicio", () => {
  it("con carga, grafica el 1RM estimado", () => {
    const points = progressSeries(
      [
        set({ weightKg: 50, reps: 10, completedAt: new Date("2026-07-01T12:00:00Z") }),
        set({ weightKg: 60, reps: 10, completedAt: new Date("2026-07-08T12:00:00Z") }),
      ],
      "weight_reps",
      null,
    );
    expect(points).toHaveLength(2);
    expect(points[1]?.value).toBeGreaterThan(points[0]?.value ?? 0);
    expect(points[0]?.label).toBe("1RM estimado");
  });

  it("sin carga, grafica la mejor serie en repeticiones", () => {
    // Este es el caso del cliente: puro peso corporal en casa.
    const points = progressSeries(
      [
        set({ reps: 8, completedAt: new Date("2026-07-01T12:00:00Z") }),
        set({ reps: 15, completedAt: new Date("2026-08-01T12:00:00Z") }),
      ],
      "reps_only",
      null,
    );
    expect(points.map((p) => p.value)).toEqual([8, 15]);
    expect(points[0]?.label).toBe("Mejor serie (reps)");
  });

  it("en isométricos, grafica el mejor tiempo", () => {
    const points = progressSeries(
      [set({ reps: null, durationSeconds: 45 }), set({ reps: null, durationSeconds: 60 })],
      "time",
      null,
    );
    expect(points[0]?.value).toBe(60);
  });

  it("en cardio, grafica el ritmo y menos es mejor", () => {
    const points = progressSeries(
      [set({ reps: null, distanceM: 5000, durationSeconds: 1800 })],
      "distance_time",
      null,
    );
    expect(points[0]?.value).toBeCloseTo(6, 1);
  });

  it("toma la mejor serie de cada día, no todas", () => {
    const points = progressSeries(
      [set({ reps: 8 }), set({ reps: 12 }), set({ reps: 10 })],
      "reps_only",
      null,
    );
    expect(points).toHaveLength(1);
    expect(points[0]?.value).toBe(12);
  });

  it("el calentamiento no cuenta para el progreso", () => {
    const points = progressSeries(
      [set({ reps: 30, isWarmup: true }), set({ reps: 10 })],
      "reps_only",
      null,
    );
    expect(points[0]?.value).toBe(10);
  });
});

describe("récord personal", () => {
  it("encuentra la mejor marca con su fecha", () => {
    const pr = personalRecord(
      [
        set({ reps: 8, completedAt: new Date("2026-07-01T12:00:00Z") }),
        set({ reps: 15, completedAt: new Date("2026-07-15T12:00:00Z") }),
        set({ reps: 12, completedAt: new Date("2026-08-01T12:00:00Z") }),
      ],
      "reps_only",
      null,
    );
    expect(pr).toEqual({ value: 15, date: "2026-07-15" });
  });

  it("en ritmo, el récord es el valor más bajo", () => {
    const pr = personalRecord(
      [
        set({
          reps: null,
          distanceM: 1000,
          durationSeconds: 360,
          completedAt: new Date("2026-07-01T12:00:00Z"),
        }),
        set({
          reps: null,
          distanceM: 1000,
          durationSeconds: 300,
          completedAt: new Date("2026-07-08T12:00:00Z"),
        }),
      ],
      "distance_time",
      null,
    );
    expect(pr?.value).toBeCloseTo(5, 1);
  });

  it("sin series no hay récord", () => {
    expect(personalRecord([], "reps_only", null)).toBeNull();
  });
});

describe("semanas y volumen semanal", () => {
  it("agrupa por semana respetando el inicio de semana del usuario", () => {
    // 2026-08-06 es jueves. Con semana desde lunes, cae en la del 2026-08-03.
    expect(weekKey(new Date("2026-08-06T12:00:00Z"), 1)).toBe("2026-08-03");
    // Con semana desde domingo, cae en la del 2026-08-02.
    expect(weekKey(new Date("2026-08-06T12:00:00Z"), 7)).toBe("2026-08-02");
  });

  it("suma el volumen de cada semana", () => {
    const weeks = weeklyVolume(
      [
        set({ reps: 10, weightKg: 50, completedAt: new Date("2026-08-04T12:00:00Z") }),
        set({ reps: 10, weightKg: 50, completedAt: new Date("2026-08-05T12:00:00Z") }),
        set({ reps: 10, weightKg: 50, completedAt: new Date("2026-08-11T12:00:00Z") }),
      ],
      1,
      null,
    );
    expect(weeks).toEqual([
      { week: "2026-08-03", volume: 1000, sets: 2 },
      { week: "2026-08-10", volume: 500, sets: 1 },
    ]);
  });
});

describe("racha de constancia", () => {
  const weeks = ["2026-07-20", "2026-07-27", "2026-08-03"];

  it("cuenta semanas seguidas hacia atrás", () => {
    expect(currentStreak(weeks, 1, new Date("2026-08-06T12:00:00Z"))).toBe(3);
  });

  it("una semana saltada corta la racha", () => {
    expect(
      currentStreak(
        ["2026-07-06", "2026-07-27", "2026-08-03"],
        1,
        new Date("2026-08-06T12:00:00Z"),
      ),
    ).toBe(2);
  });

  it("perdona que la semana en curso todavía no tenga entrenamiento", () => {
    expect(currentStreak(["2026-07-20", "2026-07-27"], 1, new Date("2026-08-06T12:00:00Z"))).toBe(
      2,
    );
  });

  it("sin historial la racha es cero", () => {
    expect(currentStreak([], 1)).toBe(0);
  });
});

describe("tendencia", () => {
  const weekly = (volumes: number[]) =>
    volumes.map((volume, i) => ({
      week: `2026-0${Math.floor(i / 4) + 6}-${String((i % 4) * 7 + 1).padStart(2, "0")}`,
      volume,
      sets: 3,
    }));

  it("con menos de 8 semanas no inventa un veredicto", () => {
    expect(volumeTrend(weekly([100, 100, 100, 100])).direction).toBe("unknown");
  });

  it("detecta que va subiendo", () => {
    const trend = volumeTrend(weekly([100, 100, 100, 100, 130, 130, 130, 130]));
    expect(trend.direction).toBe("up");
    expect(trend.changePct).toBeCloseTo(30, 0);
  });

  it("detecta que va bajando", () => {
    expect(volumeTrend(weekly([200, 200, 200, 200, 100, 100, 100, 100])).direction).toBe("down");
  });

  it("un cambio pequeño es estable, no una mejora", () => {
    expect(volumeTrend(weekly([100, 100, 100, 100, 102, 102, 102, 102])).direction).toBe("flat");
  });
});
