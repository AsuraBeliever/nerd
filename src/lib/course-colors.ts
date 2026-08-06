/**
 * Las materias guardan un token ("emerald"), no un hex: el color se adapta
 * solo a claro y oscuro, y cambiar la paleta no obliga a migrar datos.
 *
 * Las clases están escritas completas a propósito. Tailwind analiza el código
 * fuente en busca de cadenas literales; construirlas con plantillas
 * (`bg-course-${x}`) haría que no se generen.
 */
export const COURSE_COLORS = [
  "blue",
  "emerald",
  "amber",
  "rose",
  "violet",
  "cyan",
  "orange",
  "lime",
] as const;

export type CourseColor = (typeof COURSE_COLORS)[number];

const CLASSES: Record<CourseColor, { dot: string; bg: string; border: string; text: string }> = {
  blue: {
    dot: "bg-course-blue",
    bg: "bg-course-blue/10",
    border: "border-course-blue/40",
    text: "text-course-blue",
  },
  emerald: {
    dot: "bg-course-emerald",
    bg: "bg-course-emerald/10",
    border: "border-course-emerald/40",
    text: "text-course-emerald",
  },
  amber: {
    dot: "bg-course-amber",
    bg: "bg-course-amber/10",
    border: "border-course-amber/40",
    text: "text-course-amber",
  },
  rose: {
    dot: "bg-course-rose",
    bg: "bg-course-rose/10",
    border: "border-course-rose/40",
    text: "text-course-rose",
  },
  violet: {
    dot: "bg-course-violet",
    bg: "bg-course-violet/10",
    border: "border-course-violet/40",
    text: "text-course-violet",
  },
  cyan: {
    dot: "bg-course-cyan",
    bg: "bg-course-cyan/10",
    border: "border-course-cyan/40",
    text: "text-course-cyan",
  },
  orange: {
    dot: "bg-course-orange",
    bg: "bg-course-orange/10",
    border: "border-course-orange/40",
    text: "text-course-orange",
  },
  lime: {
    dot: "bg-course-lime",
    bg: "bg-course-lime/10",
    border: "border-course-lime/40",
    text: "text-course-lime",
  },
};

export function courseColor(color: string) {
  return CLASSES[
    (COURSE_COLORS as readonly string[]).includes(color) ? (color as CourseColor) : "blue"
  ];
}

/** Sugiere el siguiente color libre para que dos materias no salgan iguales. */
export function suggestColor(used: string[]): CourseColor {
  const free = COURSE_COLORS.find((c) => !used.includes(c));
  return free ?? COURSE_COLORS[used.length % COURSE_COLORS.length] ?? "blue";
}
