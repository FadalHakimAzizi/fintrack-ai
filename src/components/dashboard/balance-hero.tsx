import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/utils";

interface Props {
  greeting: string;
  name: string;
  initials: string;
  dateLabel: string;
  monthLabel: string;
  net: number;
  income: number;
  expense: number;
  savingsRate: number;
  currency: string;
}

/**
 * Eye-catching summary banner. Built on the `primary-container` token, which
 * stays a saturated, brand-tinted surface with legible light text in BOTH
 * light and dark mode across every theme — unlike `primary`, which flips.
 */
export function BalanceHero({
  greeting,
  name,
  initials,
  dateLabel,
  monthLabel,
  net,
  income,
  expense,
  savingsRate,
  currency,
}: Props) {
  const positive = net >= 0;
  return (
    <section className="animate-fade-up surface-sheen relative overflow-hidden rounded-2xl bg-primary-container p-6 text-white shadow-elevated md:p-8">
      {/* Ambient glows — pure decoration, no layout cost */}
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-12 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
      {/* Darken the surface a touch so white text stays high-contrast even on
          the lighter themes (orange / pink). */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-black/10 to-black/30" />

      <div className="relative">
        {/* Greeting row */}
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/20 font-h2 text-body-md font-bold ring-1 ring-inset ring-white/30 backdrop-blur-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-white/85">{greeting},</p>
            <h2 className="truncate font-display text-h2 leading-tight drop-shadow-sm">
              {name} 👋
            </h2>
          </div>
          <div className="ml-auto hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-body-sm font-medium ring-1 ring-inset ring-white/25 backdrop-blur-sm sm:flex">
            <Icon name="calendar_today" />
            {dateLabel}
          </div>
        </div>

        {/* Balance */}
        <div className="mt-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-white/85">
              Saldo bersih · {monthLabel}
            </p>
            <p className="mt-1 break-words font-display text-h1 leading-none tabular drop-shadow-sm md:text-display">
              {formatCurrency(net, currency)}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-2 text-body-sm font-semibold ring-1 ring-inset ring-white/30 backdrop-blur-sm">
            <Icon name={positive ? "savings" : "trending_down"} filled />
            {positive ? `Saving rate ${savingsRate.toFixed(0)}%` : "Defisit bulan ini"}
          </div>
        </div>

        {/* Income / expense glance */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:max-w-lg">
          <div className="rounded-xl bg-white/15 p-3.5 ring-1 ring-inset ring-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-body-sm font-medium text-white/85">
              <Icon name="south_west" />
              Masuk
            </div>
            <div className="mt-1 truncate font-h2 text-h3 tabular drop-shadow-sm">
              {formatCurrency(income, currency)}
            </div>
          </div>
          <div className="rounded-xl bg-white/15 p-3.5 ring-1 ring-inset ring-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-body-sm font-medium text-white/85">
              <Icon name="north_east" />
              Keluar
            </div>
            <div className="mt-1 truncate font-h2 text-h3 tabular drop-shadow-sm">
              {formatCurrency(expense, currency)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
