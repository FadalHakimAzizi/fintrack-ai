import { cn } from "@/lib/utils";

interface Props {
  values: number[];
  color: string;
  className?: string;
}

/**
 * Tiny axis-less trend line for stat cards. Pure SVG (server-safe). Stretches
 * to fill its container; `non-scaling-stroke` keeps the line crisp and the
 * rounded cap marks the latest point without distorting under the stretch.
 */
export function Sparkline({ values, color, className }: Props) {
  const w = 140;
  const h = 40;
  const pad = 4;
  const safe = values && values.length ? values : [0, 0];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const range = max - min || 1;
  const n = safe.length;

  const x = (i: number) => (n === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1));
  const y = (v: number) => pad + (h - pad * 2) - ((v - min) / range) * (h - pad * 2);

  const line = safe
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${x(n - 1).toFixed(1)} ${h - pad} L ${x(0).toFixed(1)} ${h - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-9 w-full", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={area} fill={color} opacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
