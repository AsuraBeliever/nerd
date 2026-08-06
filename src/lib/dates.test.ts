import { describe, expect, it } from "vitest";
import {
  formatTime,
  minutesToTime,
  orderedWeekdays,
  relativeDueLabel,
  timeToMinutes,
  todayIn,
  urgencyOf,
  utcToZonedInput,
  weekdayIn,
  zonedInputToUtc,
} from "./dates";

const TZ = "America/Mexico_City";

describe("conversión de horas", () => {
  it("convierte hora a minutos", () => {
    expect(timeToMinutes("07:30:00")).toBe(450);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("convierte minutos a hora", () => {
    expect(minutesToTime(450)).toBe("07:30");
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("formatea en 12 horas", () => {
    expect(formatTime("07:30:00")).toBe("7:30 am");
    expect(formatTime("13:05:00")).toBe("1:05 pm");
    expect(formatTime("00:15:00")).toBe("12:15 am");
    expect(formatTime("12:00:00")).toBe("12:00 pm");
  });
});

describe("zona horaria del usuario", () => {
  it("calcula el día del usuario, no el del servidor", () => {
    // 06:00 UTC del 6 de agosto es todavía el 5 en Ciudad de México (UTC-6).
    const instant = new Date("2026-08-06T04:00:00Z");
    expect(todayIn(TZ, instant)).toBe("2026-08-05");
    expect(todayIn("UTC", instant)).toBe("2026-08-06");
  });

  it("devuelve el día de la semana en formato ISO", () => {
    // 2026-08-06 es jueves.
    expect(weekdayIn("UTC", new Date("2026-08-06T12:00:00Z"))).toBe(4);
    // 2026-08-09 es domingo → 7, no 0.
    expect(weekdayIn("UTC", new Date("2026-08-09T12:00:00Z"))).toBe(7);
  });
});

describe("urgencia de una entrega", () => {
  const now = new Date("2026-08-06T18:00:00Z");

  it("sin fecha nunca es urgente", () => {
    expect(urgencyOf(null, TZ, now)).toBe("no-date");
  });

  it("distingue vencida, hoy, mañana, esta semana y después", () => {
    expect(urgencyOf(new Date("2026-08-04T18:00:00Z"), TZ, now)).toBe("overdue");
    expect(urgencyOf(new Date("2026-08-06T23:00:00Z"), TZ, now)).toBe("today");
    expect(urgencyOf(new Date("2026-08-07T18:00:00Z"), TZ, now)).toBe("tomorrow");
    expect(urgencyOf(new Date("2026-08-10T18:00:00Z"), TZ, now)).toBe("this-week");
    expect(urgencyOf(new Date("2026-09-10T18:00:00Z"), TZ, now)).toBe("later");
  });
});

describe("fechas en lenguaje natural", () => {
  const now = new Date("2026-08-06T18:00:00Z");

  it("usa palabras para lo cercano", () => {
    expect(relativeDueLabel(new Date("2026-08-06T20:00:00Z"), TZ, false, now)).toBe("Hoy");
    expect(relativeDueLabel(new Date("2026-08-07T20:00:00Z"), TZ, false, now)).toBe("Mañana");
    expect(relativeDueLabel(new Date("2026-08-05T20:00:00Z"), TZ, false, now)).toBe("Ayer");
    expect(relativeDueLabel(new Date("2026-08-03T20:00:00Z"), TZ, false, now)).toBe("Hace 3 días");
    expect(relativeDueLabel(new Date("2026-08-09T20:00:00Z"), TZ, false, now)).toBe("En 3 días");
  });

  it("agrega la hora solo si la tarea la tiene", () => {
    expect(relativeDueLabel(new Date("2026-08-06T20:00:00Z"), TZ, true, now)).toContain("Hoy ·");
    expect(relativeDueLabel(new Date("2026-08-06T20:00:00Z"), TZ, false, now)).toBe("Hoy");
  });

  it("sin fecha lo dice claro", () => {
    expect(relativeDueLabel(null, TZ)).toBe("Sin fecha");
  });
});

describe("captura de fechas en la zona del usuario", () => {
  it("interpreta la hora escrita en la zona del usuario, no la del servidor", () => {
    // Viernes 7 pm en México (UTC-6) es sábado 1:00 UTC.
    const utc = zonedInputToUtc("2026-08-07", "19:00", TZ);
    expect(utc?.toISOString()).toBe("2026-08-08T01:00:00.000Z");
  });

  it("sin hora ancla al final del día del usuario", () => {
    const utc = zonedInputToUtc("2026-08-07", null, TZ);
    // 23:59 del 7 en México sigue siendo el 7 para el usuario.
    expect(todayIn(TZ, utc as Date)).toBe("2026-08-07");
  });

  it("la ida y vuelta no mueve la fecha", () => {
    const utc = zonedInputToUtc("2026-08-07", "19:00", TZ);
    expect(utcToZonedInput(utc, TZ)).toEqual({ date: "2026-08-07", time: "19:00" });
  });

  it("una entrega nocturna no se corre de día al editarla", () => {
    // 23:30 local cae al día siguiente en UTC: es donde suele romperse.
    const utc = zonedInputToUtc("2026-08-07", "23:30", TZ);
    expect(utc?.toISOString().slice(0, 10)).toBe("2026-08-08");
    expect(utcToZonedInput(utc, TZ).date).toBe("2026-08-07");
  });

  it("sin fecha no inventa nada", () => {
    expect(zonedInputToUtc(null, "19:00", TZ)).toBeNull();
    expect(utcToZonedInput(null, TZ)).toEqual({ date: null, time: null });
  });
});

describe("orden de la semana configurable", () => {
  it("empieza en lunes por defecto", () => {
    expect(orderedWeekdays(1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("empieza en domingo si el usuario lo prefiere", () => {
    expect(orderedWeekdays(7)).toEqual([7, 1, 2, 3, 4, 5, 6]);
  });

  it("empieza en sábado si al usuario le sirve", () => {
    expect(orderedWeekdays(6)).toEqual([6, 7, 1, 2, 3, 4, 5]);
  });
});
