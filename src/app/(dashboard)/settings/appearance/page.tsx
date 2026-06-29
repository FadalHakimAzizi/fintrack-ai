"use client";

import { useApp } from "@/lib/app-provider";
import { LOCALES, THEMES, type Locale, type ThemeName, type Mode } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import Link from "next/link";

function SectionHead({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
        <Icon name={icon} filled />
      </span>
      <div>
        <h2 className="font-h2 text-h3 tracking-tight text-on-surface">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-body-sm text-on-surface-variant">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default function AppearancePage() {
  const { locale, theme, mode, setLocale, setTheme, setMode, t } = useApp();

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-outline-variant/50 bg-surface-container-lowest/70 px-6 py-4 backdrop-blur-xl md:px-8">
        <Link
          href="/settings"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <Icon name="arrow_back" />
        </Link>
        <div>
          <h1 className="font-h2 text-h3 tracking-tight text-on-surface">{t("appearance.title")}</h1>
          <p className="text-body-sm text-on-surface-variant">{t("appearance.subtitle")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full p-6 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* ── Language ── */}
          <section className="animate-fade-up space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card">
            <SectionHead icon="translate" title={t("appearance.language")} subtitle={t("appearance.languageSubtitle")} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {LOCALES.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => setLocale(loc.value as Locale)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                    locale === loc.value
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container",
                  )}
                >
                  <span className="text-2xl leading-none">{loc.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-body-md font-medium", locale === loc.value ? "text-primary" : "text-on-surface")}>
                      {loc.label}
                    </div>
                    {loc.dir === "rtl" && <div className="text-label-caps text-outline">RTL</div>}
                  </div>
                  {locale === loc.value && <Icon name="check_circle" filled className="shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          </section>

          {/* ── Display Mode ── */}
          <section className="animate-fade-up space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card">
            <SectionHead icon="contrast" title={t("appearance.mode")} subtitle={t("appearance.modeSubtitle")} />
            <div className="flex gap-3">
              {(["light", "dark"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-3 rounded-xl border-2 py-5 transition-all",
                    mode === m
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container",
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-16 overflow-hidden rounded-lg border",
                    m === "light" ? "border-outline-variant/40 bg-white" : "border-gray-700 bg-gray-900",
                  )}>
                    <div className={cn("h-full w-5", m === "light" ? "bg-blue-100" : "bg-gray-800")} />
                    <div className="flex-1 space-y-1 p-1.5">
                      <div className={cn("h-1.5 rounded-full", m === "light" ? "bg-gray-300" : "bg-gray-600")} />
                      <div className={cn("h-1.5 w-3/4 rounded-full", m === "light" ? "bg-gray-200" : "bg-gray-700")} />
                    </div>
                  </div>
                  <span className={cn("text-body-sm font-medium", mode === m ? "text-primary" : "text-on-surface-variant")}>
                    {m === "light" ? t("appearance.lightMode") : t("appearance.darkMode")}
                  </span>
                  {mode === m && <Icon name="check_circle" filled className="text-primary" />}
                </button>
              ))}
            </div>
          </section>

          {/* ── Color Theme ── */}
          <section className="animate-fade-up space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card">
            <SectionHead icon="palette" title={t("appearance.theme")} subtitle={t("appearance.themeSubtitle")} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {THEMES.map((th) => (
                <button
                  key={th.value}
                  onClick={() => setTheme(th.value as ThemeName)}
                  className={cn(
                    "relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                    theme === th.value
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-outline-variant hover:bg-surface-container",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full shadow-sm" style={{ backgroundColor: th.primary }} />
                    <div className="-ml-3 h-5 w-5 rounded-full border-2 border-surface-container-lowest shadow-sm" style={{ backgroundColor: th.secondary }} />
                  </div>
                  <span className={cn("text-body-sm font-medium leading-tight", theme === th.value ? "text-primary" : "text-on-surface")}>
                    {th.label}
                  </span>
                  {theme === th.value && (
                    <div className="absolute right-2 top-2">
                      <Icon name="check_circle" filled className="text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ── Preview ── */}
          <section className="animate-fade-up space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card">
            <SectionHead icon="visibility" title="Pratinjau" subtitle="Cek kombinasi warna tema aktif" />
            <div className="flex flex-wrap gap-2">
              <div className="rounded-lg bg-primary px-4 py-2 text-body-sm font-medium text-on-primary">Primary</div>
              <div className="rounded-lg bg-secondary px-4 py-2 text-body-sm font-medium text-on-secondary">Secondary</div>
              <div className="rounded-lg bg-tertiary px-4 py-2 text-body-sm font-medium text-on-tertiary">Tertiary</div>
              <div className="rounded-lg bg-error px-4 py-2 text-body-sm font-medium text-on-error">Error</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-lg border border-outline-variant/40 bg-surface-container px-4 py-2 text-body-sm text-on-surface">Surface</div>
              <div className="rounded-lg bg-primary-container px-4 py-2 text-body-sm text-on-primary-container">Primary Container</div>
              <div className="rounded-lg bg-secondary-container px-4 py-2 text-body-sm text-on-secondary-container">Secondary Container</div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
