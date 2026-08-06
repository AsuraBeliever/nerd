import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("junta clases sueltas", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("resuelve conflictos de Tailwind: la última gana", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignora valores falsos", () => {
    expect(cn("px-2", false, undefined, null, "py-1")).toBe("px-2 py-1");
  });

  it("acepta clases condicionales", () => {
    expect(cn("base", { activo: true, inactivo: false })).toBe("base activo");
  });
});
