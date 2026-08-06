import { describe, expect, it } from "vitest";
import type { AttendanceStatus } from "@/db/schema";
import {
  type AttendanceRules,
  attendancePct,
  countStatuses,
  effectiveAbsences,
  estimateTotalSessions,
  maxAllowedAbsences,
  riskLevel,
  summarize,
} from "./lib";

/** Los valores del cliente: 80%, justificadas cuentan, retardos no existen. */
const CLIENT: AttendanceRules = {
  minPct: 80,
  excusedCountsAsPresent: true,
  trackLates: false,
  latesPerAbsence: null,
};

/** Otra escuela: justificadas no cuentan y 3 retardos hacen una falta. */
const STRICT: AttendanceRules = {
  minPct: 90,
  excusedCountsAsPresent: false,
  trackLates: true,
  latesPerAbsence: 3,
};

const list = (spec: Partial<Record<AttendanceStatus, number>>): AttendanceStatus[] => {
  const out: AttendanceStatus[] = [];
  for (const [status, n] of Object.entries(spec)) {
    for (let i = 0; i < (n ?? 0); i++) out.push(status as AttendanceStatus);
  }
  return out;
};

describe("conteo de estados", () => {
  it("cuenta cada estado por separado", () => {
    const counts = countStatuses(list({ present: 3, absent: 2, cancelled: 1 }));
    expect(counts).toEqual({ present: 3, absent: 2, late: 0, excused: 0, cancelled: 1 });
  });
});

describe("faltas efectivas", () => {
  it("con las reglas del cliente, solo las ausencias cuentan", () => {
    const counts = countStatuses(list({ present: 10, absent: 2, excused: 3, late: 4 }));
    expect(effectiveAbsences(counts, CLIENT)).toBe(2);
  });

  it("si las justificadas no cuentan, suman como falta", () => {
    const counts = countStatuses(list({ present: 10, absent: 2, excused: 3 }));
    expect(effectiveAbsences(counts, STRICT)).toBe(5);
  });

  it("aplica la regla de 3 retardos = 1 falta, redondeando hacia abajo", () => {
    const counts = countStatuses(list({ present: 10, absent: 1, late: 7 }));
    expect(effectiveAbsences(counts, STRICT)).toBe(1 + 2);
  });

  it("sin la regla activa, los retardos no suman faltas", () => {
    const counts = countStatuses(list({ absent: 1, late: 9 }));
    expect(effectiveAbsences(counts, CLIENT)).toBe(1);
  });
});

describe("porcentaje de asistencia", () => {
  it("las canceladas salen del denominador", () => {
    const counts = countStatuses(list({ present: 8, absent: 2, cancelled: 5 }));
    expect(attendancePct(counts, CLIENT)).toBe(80);
  });

  it("con las reglas del cliente, las justificadas cuentan como asistencia", () => {
    const counts = countStatuses(list({ present: 6, excused: 2, absent: 2 }));
    expect(attendancePct(counts, CLIENT)).toBe(80);
  });

  it("con reglas estrictas, las justificadas bajan el porcentaje", () => {
    const counts = countStatuses(list({ present: 6, excused: 2, absent: 2 }));
    expect(attendancePct(counts, STRICT)).toBe(60);
  });

  it("sin sesiones registradas no inventa un porcentaje", () => {
    expect(attendancePct(countStatuses([]), CLIENT)).toBeNull();
  });

  it("solo canceladas tampoco produce porcentaje", () => {
    expect(attendancePct(countStatuses(list({ cancelled: 4 })), CLIENT)).toBeNull();
  });
});

describe("estimación de sesiones del semestre", () => {
  it("multiplica bloques por semana por las semanas del periodo", () => {
    // 2026-08-03 a 2026-11-23 son 16 semanas; 2 clases por semana = 32.
    expect(
      estimateTotalSessions({
        blocksPerWeek: 2,
        startDate: "2026-08-03",
        endDate: "2026-11-23",
        override: null,
      }),
    ).toBe(32);
  });

  it("el total fijado a mano le gana a la estimación", () => {
    expect(
      estimateTotalSessions({
        blocksPerWeek: 2,
        startDate: "2026-08-03",
        endDate: "2026-11-23",
        override: 40,
      }),
    ).toBe(40);
  });

  it("sin fechas del semestre no adivina", () => {
    expect(
      estimateTotalSessions({ blocksPerWeek: 2, startDate: null, endDate: null, override: null }),
    ).toBeNull();
  });

  it("una materia sin horario no se puede estimar", () => {
    expect(
      estimateTotalSessions({
        blocksPerWeek: 0,
        startDate: "2026-08-03",
        endDate: "2026-11-23",
        override: null,
      }),
    ).toBeNull();
  });
});

describe("faltas máximas permitidas", () => {
  it("el caso real del cliente: 32 sesiones al 80% son 6 faltas", () => {
    expect(maxAllowedAbsences(32, 80)).toBe(6);
  });

  it("redondea hacia abajo, nunca a favor de más faltas", () => {
    expect(maxAllowedAbsences(30, 90)).toBe(3);
    expect(maxAllowedAbsences(31, 90)).toBe(3);
  });

  it("al 100% no se permite ninguna falta", () => {
    expect(maxAllowedAbsences(32, 100)).toBe(0);
  });
});

describe("resumen completo", () => {
  it("responde la pregunta del cliente: cuántas faltas me quedan", () => {
    const summary = summarize({
      statuses: list({ present: 12, absent: 2 }),
      rules: CLIENT,
      blocksPerWeek: 2,
      startDate: "2026-08-03",
      endDate: "2026-11-23",
      override: null,
    });

    expect(summary.totalSessions).toBe(32);
    expect(summary.maxAbsences).toBe(6);
    expect(summary.absences).toBe(2);
    expect(summary.remaining).toBe(4);
    expect(summary.level).toBe("safe");
  });

  it("avisa cuando quedan pocas faltas", () => {
    const summary = summarize({
      statuses: list({ present: 10, absent: 4 }),
      rules: CLIENT,
      blocksPerWeek: 2,
      startDate: "2026-08-03",
      endDate: "2026-11-23",
      override: null,
    });
    expect(summary.remaining).toBe(2);
    expect(summary.level).toBe("warning");
  });

  it("marca crítico cuando queda una sola", () => {
    const summary = summarize({
      statuses: list({ present: 10, absent: 5 }),
      rules: CLIENT,
      blocksPerWeek: 2,
      startDate: "2026-08-03",
      endDate: "2026-11-23",
      override: null,
    });
    expect(summary.remaining).toBe(1);
    expect(summary.level).toBe("critical");
  });

  it("solo dice 'rebasado' cuando ya es imposible llegar al mínimo", () => {
    const summary = summarize({
      statuses: list({ present: 10, absent: 7 }),
      rules: CLIENT,
      blocksPerWeek: 2,
      startDate: "2026-08-03",
      endDate: "2026-11-23",
      override: null,
    });
    expect(summary.remaining).toBe(-1);
    expect(summary.level).toBe("exceeded");
  });

  it("faltar temprano no pinta de rojo si el semestre todavía se salva", () => {
    // 4 faltas en las primeras 14 clases: 71% hoy, pero con 32 sesiones
    // todavía puede terminar arriba del 80%. Decirle "reprobaste" sería mentir.
    const summary = summarize({
      statuses: list({ present: 10, absent: 4 }),
      rules: CLIENT,
      blocksPerWeek: 2,
      startDate: "2026-08-03",
      endDate: "2026-11-23",
      override: null,
    });
    expect(summary.currentPct).toBeCloseTo(71.43, 1);
    expect(summary.level).not.toBe("exceeded");
  });

  it("sin fechas del semestre da el porcentaje pero no las faltas restantes", () => {
    const summary = summarize({
      statuses: list({ present: 8, absent: 2 }),
      rules: CLIENT,
      blocksPerWeek: 2,
      startDate: null,
      endDate: null,
      override: null,
    });
    expect(summary.currentPct).toBe(80);
    expect(summary.remaining).toBeNull();
  });

  it("sin ningún registro no inventa nada", () => {
    const summary = summarize({
      statuses: [],
      rules: CLIENT,
      blocksPerWeek: 2,
      startDate: "2026-08-03",
      endDate: "2026-11-23",
      override: null,
    });
    expect(summary.currentPct).toBeNull();
    expect(summary.remaining).toBe(6);
  });
});

describe("semáforo", () => {
  it("respeta los bordes exactos", () => {
    expect(riskLevel(4, 90, 80)).toBe("safe");
    expect(riskLevel(3, 90, 80)).toBe("warning");
    expect(riskLevel(2, 90, 80)).toBe("warning");
    expect(riskLevel(1, 90, 80)).toBe("critical");
    expect(riskLevel(0, 85, 80)).toBe("critical");
    expect(riskLevel(-1, 85, 80)).toBe("exceeded");
  });

  it("manda cuántas faltas quedan, no el porcentaje de hoy", () => {
    // Va al 70% ahora mismo, pero todavía le quedan 5 faltas de margen.
    expect(riskLevel(5, 70, 80)).toBe("safe");
  });

  it("sin estimación del total, decide el porcentaje corriente", () => {
    expect(riskLevel(null, 70, 80)).toBe("exceeded");
    expect(riskLevel(null, 95, 80)).toBe("safe");
    expect(riskLevel(null, null, 80)).toBe("none");
  });
});
