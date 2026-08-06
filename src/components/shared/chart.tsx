/**
 * Gráficas mínimas en SVG, sin librería.
 *
 * Se valoró Recharts, pero para una línea y unas barras sin cuadrícula ni
 * leyendas eran ~90 KB de JavaScript para el navegador a cambio de nada:
 * esto son 60 líneas, se renderiza en el servidor y encaja exactamente con
 * el sistema de diseño. Si algún día hacen falta gráficas interactivas, se
 * reconsidera.
 */

export type Point = { label: string; value: number };

export function LineChart({
  points,
  height = 140,
  suffix = "",
}: {
  points: Point[];
  height?: number;
  suffix?: string;
}) {
  if (points.length < 2) {
    return (
      <p className="py-6 text-center text-[13px] text-text-subtle">
        Necesitas al menos dos registros para ver la tendencia.
      </p>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 100;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p.value - min) / range) * (height - 16) - 8;
    return { x, y, ...p };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const last = coords[coords.length - 1];
  const first = points[0];
  const lastPoint = points[points.length - 1];

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-32 w-full"
        role="img"
        aria-label={`De ${first?.value.toFixed(1)}${suffix} a ${lastPoint?.value.toFixed(1)}${suffix}`}
      >
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {last && (
          <circle
            cx={last.x}
            cy={last.y}
            r="2.5"
            fill="var(--accent)"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-text-subtle">
        <span>
          {first?.label} · {round(min)}
          {suffix}
        </span>
        <span>
          {lastPoint?.label} · {round(max)}
          {suffix}
        </span>
      </figcaption>
    </figure>
  );
}

export function BarChart({ points, suffix = "" }: { points: Point[]; suffix?: string }) {
  if (points.length === 0) {
    return <p className="py-6 text-center text-[13px] text-text-subtle">Todavía no hay datos.</p>;
  }

  const max = Math.max(...points.map((p) => p.value)) || 1;

  return (
    <ul className="flex h-32 items-end gap-1">
      {points.map((point) => (
        <li key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="sr-only">
            {point.label}: {round(point.value)}
            {suffix}
          </span>
          <div
            className="w-full rounded-t-sm bg-accent/70"
            style={{ height: `${Math.max((point.value / max) * 100, 2)}%` }}
            title={`${point.label}: ${round(point.value)}${suffix}`}
          />
          <span className="w-full truncate text-center text-[10px] text-text-subtle">
            {point.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function round(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(value % 1 === 0 ? 0 : 1);
}
