import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our Tailwind theme defines custom font-size tokens (text-body-sm, text-h2, …).
// tailwind-merge's defaults don't know these are FONT SIZES, so it treats e.g.
// `text-body-sm` as a text COLOR. That made it drop real colors like
// `text-on-primary` whenever a size + color appeared together (every Button),
// leaving buttons with dark inherited text on dark backgrounds. Registering the
// tokens under the font-size group fixes the misclassification.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "body-lg",
            "body-md",
            "body-sm",
            "label-caps",
            "numeric",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "IDR",
  locale = "id-ID",
): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString(locale)}`;
  }
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}
