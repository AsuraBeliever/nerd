import { describe, expect, it } from "vitest";
import {
  blocksOfDay,
  blocksOverlap,
  currentClassStatus,
  findOverlaps,
  gridTimeRange,
  visibleWeekdays,
} from "./lib";

const block = (id: string, weekday: number, startTime: string, endTime: string) => ({
  id,
  weekday,
  startTime,
  endTime,
});

describe("traslapes de horario", () => {
  it("detecta un choque el mismo día", () => {
    expect(blocksOverlap(block("a", 1, "07:00", "09:00"), block("b", 1, "08:00", "10:00"))).toBe(
      true,
    );
  });

  it("no hay choque en días distintos", () => {
    expect(blocksOverlap(block("a", 1, "07:00", "09:00"), block("b", 2, "07:00", "09:00"))).toBe(
      false,
    );
  });

  it("terminar justo cuando otra empieza no es choque", () => {
    expect(blocksOverlap(block("a", 1, "07:00", "09:00"), block("b", 1, "09:00", "11:00"))).toBe(
      false,
    );
  });

  it("una clase contenida dentro de otra sí choca", () => {
    expect(blocksOverlap(block("a", 1, "07:00", "12:00"), block("b", 1, "08:00", "09:00"))).toBe(
      true,
    );
  });

  it("no se compara consigo mismo al editar", () => {
    const existing = [block("a", 1, "07:00", "09:00")];
    expect(findOverlaps(block("a", 1, "07:00", "09:00"), existing)).toHaveLength(0);
  });

  it("lista todos los bloques con los que choca", () => {
    const existing = [
      block("a", 1, "07:00", "09:00"),
      block("b", 1, "08:00", "10:00"),
      block("c", 2, "08:00", "10:00"),
    ];
    expect(findOverlaps(block("nuevo", 1, "08:30", "08:45"), existing).map((b) => b.id)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("clase actual y siguiente", () => {
  const blocks = [
    block("calculo", 4, "07:00", "09:00"),
    block("algebra", 4, "11:00", "13:00"),
    block("otro-dia", 5, "07:00", "09:00"),
  ];

  it("dice cuánto falta para que termine la clase en curso", () => {
    const status = currentClassStatus(blocks, 4, 8 * 60 + 25);
    expect(status.kind).toBe("in-class");
    if (status.kind === "in-class") {
      expect(status.block.id).toBe("calculo");
      expect(status.minutesLeft).toBe(35);
    }
  });

  it("entre clases anuncia la siguiente y en cuánto", () => {
    const status = currentClassStatus(blocks, 4, 10 * 60 + 20);
    expect(status.kind).toBe("upcoming");
    if (status.kind === "upcoming") {
      expect(status.block.id).toBe("algebra");
      expect(status.minutesUntil).toBe(40);
    }
  });

  it("antes de la primera clase anuncia esa", () => {
    const status = currentClassStatus(blocks, 4, 6 * 60);
    expect(status.kind).toBe("upcoming");
    if (status.kind === "upcoming") expect(status.block.id).toBe("calculo");
  });

  it("después de la última dice que ya no hay clases", () => {
    expect(currentClassStatus(blocks, 4, 20 * 60).kind).toBe("done");
  });

  it("un día sin clases no toma prestadas las de otro día", () => {
    expect(currentClassStatus(blocks, 7, 8 * 60).kind).toBe("done");
  });

  it("el último minuto de clase ya cuenta como terminada", () => {
    expect(currentClassStatus(blocks, 4, 9 * 60).kind).toBe("upcoming");
  });
});

describe("bloques del día", () => {
  it("los devuelve ordenados por hora", () => {
    const blocks = [
      block("tarde", 1, "15:00", "17:00"),
      block("temprano", 1, "07:00", "09:00"),
      block("medio", 1, "11:00", "13:00"),
    ];
    expect(blocksOfDay(blocks, 1).map((b) => b.id)).toEqual(["temprano", "medio", "tarde"]);
  });
});

describe("días visibles", () => {
  const order = [1, 2, 3, 4, 5, 6, 7];
  const blocks = [block("a", 1, "07:00", "09:00"), block("b", 3, "07:00", "09:00")];

  it("por defecto muestra solo los días con clase", () => {
    expect(visibleWeekdays(blocks, null, order)).toEqual([1, 3]);
  });

  it("la preferencia del usuario manda, aunque el día esté vacío", () => {
    expect(visibleWeekdays(blocks, [1, 3, 6], order)).toEqual([1, 3, 6]);
  });

  it("respeta el inicio de semana elegido", () => {
    expect(visibleWeekdays(blocks, [1, 3], [7, 1, 2, 3, 4, 5, 6])).toEqual([1, 3]);
  });

  it("sin bloques ni preferencia cae en una semana de cinco días", () => {
    expect(visibleWeekdays([], null, order)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("rango horario de la cuadrícula", () => {
  it("sale de las clases del usuario, redondeado a horas", () => {
    const blocks = [block("a", 1, "07:30", "09:15"), block("b", 2, "16:00", "17:45")];
    expect(gridTimeRange(blocks)).toEqual({ startMinutes: 420, endMinutes: 1080 });
  });

  it("sin clases usa un rango razonable", () => {
    expect(gridTimeRange([])).toEqual({ startMinutes: 420, endMinutes: 1260 });
  });

  it("nunca devuelve un rango vacío", () => {
    const blocks = [block("a", 1, "07:00", "07:30")];
    const range = gridTimeRange(blocks);
    expect(range.endMinutes).toBeGreaterThan(range.startMinutes);
  });
});
