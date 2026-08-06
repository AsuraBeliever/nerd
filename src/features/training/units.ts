export type WeightUnit = "kg" | "lb";

const LB_PER_KG = 2.20462262185;

/**
 * Toda masa se guarda en kilogramos; la unidad del usuario solo cambia cómo
 * se ve y cómo se captura (ADR-011). Cambiar de unidad a media historia no
 * toca un solo dato guardado.
 */

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === "kg" ? kg : kg * LB_PER_KG;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === "kg" ? value : value / LB_PER_KG;
}

/** Redondeo de presentación: 1 decimal basta y evita el ruido de flotantes. */
export function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatWeight(kg: number | null, unit: WeightUnit): string {
  if (kg === null) return "—";
  const value = roundWeight(kgToDisplay(kg, unit));
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
}

/**
 * Cuánto sube o baja el peso con los botones + y −.
 *
 * No se convierte el paso de una unidad a la otra a propósito: los discos y
 * las mancuernas vienen de 2.5 kg o de 5 lb, y un incremento de "5.51 lb"
 * no existe en el mundo real.
 */
export function stepFor(unit: WeightUnit): number {
  return unit === "kg" ? 2.5 : 5;
}

/** Convierte lo que el usuario escribió a los kg que se guardan. */
export function parseWeightInput(value: string, unit: WeightUnit): number | null {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(displayToKg(parsed, unit) * 100) / 100;
}
