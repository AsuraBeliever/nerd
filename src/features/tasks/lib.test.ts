import { describe, expect, it } from "vitest";
import { compareTasks, groupByUrgency, reorder, subtaskProgress, type TaskLike } from "./lib";

const TZ = "America/Mexico_City";
const NOW = new Date("2026-08-06T18:00:00Z");

const task = (over: Partial<TaskLike> & { id: string }): TaskLike => ({
  title: over.id,
  dueAt: null,
  hasTime: false,
  priority: "medium",
  status: "todo",
  sortOrder: 0,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  ...over,
});

describe("agrupación por urgencia", () => {
  it("pone lo vencido hasta arriba y lo sin fecha hasta abajo", () => {
    const groups = groupByUrgency(
      [
        task({ id: "sin-fecha" }),
        task({ id: "despues", dueAt: new Date("2026-09-15T18:00:00Z") }),
        task({ id: "vencida", dueAt: new Date("2026-08-01T18:00:00Z") }),
        task({ id: "hoy", dueAt: new Date("2026-08-06T22:00:00Z") }),
      ],
      TZ,
      NOW,
    );

    expect(groups.map((g) => g.urgency)).toEqual(["overdue", "today", "later", "no-date"]);
  });

  it("no muestra grupos vacíos", () => {
    const groups = groupByUrgency([task({ id: "a" })], TZ, NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.urgency).toBe("no-date");
  });

  it("una tarea sin fecha nunca cae en vencidas", () => {
    const groups = groupByUrgency([task({ id: "a" })], TZ, NOW);
    expect(groups.some((g) => g.urgency === "overdue")).toBe(false);
  });

  it("respeta la zona horaria del usuario", () => {
    // 04:00 UTC del 7 de agosto sigue siendo el 6 en México: vence hoy, no mañana.
    const groups = groupByUrgency(
      [task({ id: "limite", dueAt: new Date("2026-08-07T04:00:00Z") })],
      TZ,
      NOW,
    );
    expect(groups[0]?.urgency).toBe("today");
  });
});

describe("orden dentro de un grupo", () => {
  it("la prioridad alta va primero", () => {
    const alta = task({ id: "alta", priority: "high" });
    const baja = task({ id: "baja", priority: "low" });
    expect([baja, alta].sort(compareTasks).map((t) => t.id)).toEqual(["alta", "baja"]);
  });

  it("a igual prioridad, manda la hora de entrega", () => {
    const tarde = task({ id: "tarde", dueAt: new Date("2026-08-06T23:00:00Z") });
    const temprano = task({ id: "temprano", dueAt: new Date("2026-08-06T14:00:00Z") });
    expect([tarde, temprano].sort(compareTasks).map((t) => t.id)).toEqual(["temprano", "tarde"]);
  });

  it("a igual prioridad y fecha, manda el orden manual", () => {
    const segundo = task({ id: "segundo", sortOrder: 2 });
    const primero = task({ id: "primero", sortOrder: 1 });
    expect([segundo, primero].sort(compareTasks).map((t) => t.id)).toEqual(["primero", "segundo"]);
  });
});

describe("progreso de subtareas", () => {
  it("calcula el porcentaje", () => {
    expect(
      subtaskProgress([{ done: true }, { done: false }, { done: true }, { done: false }]),
    ).toEqual({
      done: 2,
      total: 4,
      pct: 50,
    });
  });

  it("sin subtareas no divide entre cero", () => {
    expect(subtaskProgress([])).toEqual({ done: 0, total: 0, pct: 0 });
  });
});

describe("reordenar", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("mueve un elemento a otra posición", () => {
    expect(reorder(items, "c", 0).map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("mover al mismo lugar no cambia nada", () => {
    expect(reorder(items, "b", 1).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("un índice fuera de rango se acota", () => {
    expect(reorder(items, "a", 99).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("un id que no existe deja la lista intacta", () => {
    expect(reorder(items, "z", 0)).toBe(items);
  });
});
