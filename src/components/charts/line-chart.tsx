import { formatCurrency } from "@/lib/utils";

interface Series {
  label: string;
  color: string;
  values: number[];
}

interface Props {
  labels: string[];
  series: Series[];
  currency?: string;
  height?: number;
}

export function LineChart({ labels, series, currency = "IDR", height = 220 }: Props) {
  const width = 720;
  const padL = 60;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const iw = width - padL - padR;
  const ih = height - padT - padB;

  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);
  const min = 0;

  const x = (i: number) =>
    labels.length === 1 ? padL + iw / 2 : padL + (i * iw) / (labels.length - 1);
  const y = (v: number) => padT + ih - ((v - min) / (max - min || 1)) * ih;

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) =>
    Math.round((max * (gridLines - i)) / gridLines),
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
    >
      {ticks.map((t, i) => {
        const yy = padT + (i * ih) / gridLines;
        return (
          <g key={i}>
            <line
              x1={padL}
              y1={yy}
              x2={width - padR}
              y2={yy}
              stroke="#c4c5d5"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <text
              x={padL - 8}
              y={yy + 4}
              fontSize="10"
              fill="#757684"
              textAnchor="end"
              className="tabular"
            >
              {formatCompact(t, currency)}
            </text>
          </g>
        );
      })}

      {labels.map((lab, i) => (
        <text
          key={i}
          x={x(i)}
          y={height - 8}
          fontSize="10"
          fill="#757684"
          textAnchor="middle"
        >
          {lab}
        </text>
      ))}

      {series.map((s) => {
        const path = s.values
          .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`)
          .join(" ");
        const area = `${path} L ${x(s.values.length - 1)} ${padT + ih} L ${x(0)} ${padT + ih} Z`;
        return (
          <g key={s.label}>
            <path d={area} fill={s.color} opacity={0.12} />
            <path d={path} fill="none" stroke={s.color} strokeWidth={2.5} />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r={3.5}
                fill="#fff"
                stroke={s.color}
                strokeWidth={2}
              >
                <title>{`${labels[i]} · ${s.label}: ${formatCurrency(v, currency)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function LineChartLegend({ series }: { series: Series[] }) {
  return (
    <div className="flex items-center gap-4 text-body-sm">
      {series.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: s.color }}
          />
          <span className="text-on-surface-variant">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function formatCompact(n: number, currency: string) {
  const abs = Math.abs(n);
  if (currency === "IDR") {
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${Math.round(n / 1_000_000)}jt`;
    if (abs >= 1_000) return `${Math.round(n / 1_000)}rb`;
    return String(n);
  }
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
