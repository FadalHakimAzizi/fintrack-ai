"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { formatCurrency, cn } from "@/lib/utils";

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
  /** Render an interactive, toggleable legend above the chart. */
  showLegend?: boolean;
}

const width = 720;
const padL = 60;
const padR = 12;
const padT = 16;
const padB = 28;

export function LineChart({
  labels,
  series,
  currency = "IDR",
  height = 220,
  showLegend = false,
}: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hoverI, setHoverI] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const visible = series.filter((s) => !hidden.has(s.label));
  const hasData =
    labels.length > 0 && series.some((s) => s.values.some((v) => v > 0));

  function toggle(label: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      // Don't allow hiding the last visible series.
      if (next.has(label)) next.delete(label);
      else if (visible.length > 1) next.add(label);
      return next;
    });
  }

  if (!hasData) {
    return (
      <div className="grid place-items-center py-10 text-center">
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-surface-container text-on-surface-variant ring-1 ring-inset ring-outline-variant/30">
          <Icon name="show_chart" />
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Belum ada cukup data untuk menampilkan tren.
        </p>
      </div>
    );
  }

  const iw = width - padL - padR;
  const ih = height - padT - padB;
  const max = Math.max(...visible.flatMap((s) => s.values), 1);
  const min = 0;

  const x = (i: number) =>
    labels.length === 1 ? padL + iw / 2 : padL + (i * iw) / (labels.length - 1);
  const y = (v: number) => padT + ih - ((v - min) / (max - min || 1)) * ih;

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) =>
    Math.round((max * (gridLines - i)) / gridLines),
  );

  function locate(clientX: number) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = rect.width / width;
    const left = padL * sx;
    const right = rect.width - padR * sx;
    const cx = clientX - rect.left;
    if (cx < left - 8 || cx > right + 8) return setHoverI(null);
    const ratio = (cx - left) / (right - left || 1);
    const i = Math.round(ratio * (labels.length - 1));
    setHoverI(Math.max(0, Math.min(labels.length - 1, i)));
  }

  // Accessible text summary of the chart's key insight.
  const ariaSummary =
    `Grafik tren ${labels.length} periode (${labels[0]}–${labels[labels.length - 1]}). ` +
    series
      .map((s) => `${s.label} terakhir ${formatCurrency(s.values.at(-1) ?? 0, currency)}`)
      .join("; ") + ".";

  const tipLeft = hoverI != null ? (x(hoverI) / width) * 100 : 0;

  return (
    <div>
      {showLegend && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {series.map((s) => {
            const off = hidden.has(s.label);
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => toggle(s.label)}
                aria-pressed={!off}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  off
                    ? "border-outline-variant/40 text-outline line-through"
                    : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container",
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: off ? "transparent" : s.color, boxShadow: off ? `inset 0 0 0 1.5px ${s.color}` : undefined }}
                />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      <div ref={wrapRef} className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto touch-none"
          preserveAspectRatio="none"
          role="img"
          aria-label={ariaSummary}
          onMouseMove={(e) => locate(e.clientX)}
          onMouseLeave={() => setHoverI(null)}
          onTouchStart={(e) => locate(e.touches[0].clientX)}
          onTouchMove={(e) => locate(e.touches[0].clientX)}
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
                  className="stroke-outline-variant/50"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <text
                  x={padL - 8}
                  y={yy + 4}
                  fontSize="10"
                  className="fill-outline tabular"
                  textAnchor="end"
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
              className={cn("fill-outline", hoverI === i && "fill-on-surface")}
              textAnchor="middle"
            >
              {lab}
            </text>
          ))}

          {/* Hover guide */}
          {hoverI != null && (
            <line
              x1={x(hoverI)}
              y1={padT}
              x2={x(hoverI)}
              y2={padT + ih}
              className="stroke-outline/40"
              strokeWidth={1}
            />
          )}

          {visible.map((s) => {
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
                    r={hoverI === i ? 5 : 3.5}
                    fill="rgb(var(--surface-container-lowest))"
                    stroke={s.color}
                    strokeWidth={2}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Floating tooltip */}
        {hoverI != null && (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 shadow-elevated"
            style={{ left: `${tipLeft}%` }}
          >
            <div className="text-label-caps text-on-surface-variant">{labels[hoverI]}</div>
            {visible.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-body-sm">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-on-surface-variant">{s.label}</span>
                <span className="ml-auto font-semibold tabular text-on-surface">
                  {formatCurrency(s.values[hoverI] ?? 0, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LineChartLegend({ series }: { series: Series[] }) {
  return (
    <div className="flex items-center gap-4 text-body-sm">
      {series.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
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
