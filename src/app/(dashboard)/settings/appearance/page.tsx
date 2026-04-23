"use client";

import { useApp } from "@/lib/app-provider";
import { LOCALES, THEMES, type Locale, type ThemeName, type Mode } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AppearancePage() {
  const { locale, theme, mode, setLocale, setTheme, setMode, t } = useApp();

  return (
    <>
      {/* TopBar inline — appearance page is client-only */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-outline-variant/30 px-8 py-4 flex items-center gap-4">
        <Link href="/settings" className="w-9 h-9 rounded-full grid place-items-center text-on-surface-variant hover:bg-surface-container transition-colors">
          <Icon name="arrow_back" />
        </Link>
        <div>
          <h1 className="text-h3 font-h3 text-on-surface">{t("appearance.title")}</h1>
          <p className="text-body-sm text-outline">{t("appearance.subtitle")}</p>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* ── Language ── */}
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-outline-variant/30 space-y-4">
            <div>
              <h2 className="text-h3 font-h3 text-on-surface">{t("appearance.language")}</h2>
              <p className="text-body-sm text-outline mt-1">{t("appearance.languageSubtitle")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LOCALES.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => setLocale(loc.value as Locale)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left",
                    locale === loc.value
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container",
                  )}
                >
                  <span className="text-2xl leading-none">{loc.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-body-md font-medium truncate", locale === loc.value ? "text-primary" : "text-on-surface")}>
                      {loc.label}
                    </div>
                    {loc.dir === "rtl" && (
                      <div className="text-label-caps text-outline">RTL</div>
                    )}
                  </div>
                  {locale === loc.value && (
                    <Icon name="check_circle" filled className="text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ── Display Mode ── */}
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-outline-variant/30 space-y-4">
            <div>
              <h2 className="text-h3 font-h3 text-on-surface">{t("appearance.mode")}</h2>
              <p className="text-body-sm text-outline mt-1">{t("appearance.modeSubtitle")}</p>
            </div>
            <div className="flex gap-3">
              {(["light", "dark"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-3 py-5 rounded-xl border-2 transition-all",
                    mode === m
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container",
                  )}
                >
                  {/* Mini preview */}
                  <div className={cn(
                    "w-16 h-10 rounded-lg border overflow-hidden flex",
                    m === "light" ? "bg-white border-outline-variant/40" : "bg-gray-900 border-gray-700",
                  )}>
                    <div className={cn("w-5 h-full", m === "light" ? "bg-blue-100" : "bg-gray-800")} />
                    <div className="flex-1 p-1.5 space-y-1">
                      <div className={cn("h-1.5 rounded-full", m === "light" ? "bg-gray-300" : "bg-gray-600")} />
                      <div className={cn("h-1.5 rounded-full w-3/4", m === "light" ? "bg-gray-200" : "bg-gray-700")} />
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
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-outline-variant/30 space-y-4">
            <div>
              <h2 className="text-h3 font-h3 text-on-surface">{t("appearance.theme")}</h2>
              <p className="text-body-sm text-outline mt-1">{t("appearance.themeSubtitle")}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {THEMES.map((th) => (
                <button
                  key={th.value}
                  onClick={() => setTheme(th.value as ThemeName)}
                  className={cn(
                    "relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
                    theme === th.value
                      ? "border-primary"
                      : "border-outline-variant/40 hover:border-outline-variant hover:bg-surface-container",
                  )}
                >
                  {/* Color swatch */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: th.primary }} />
                    <div className="w-5 h-5 rounded-full shadow-sm -ml-3 border-2 border-surface-container-lowest" style={{ backgroundColor: th.secondary }} />
                  </div>
                  <span className={cn(
                    "text-body-sm font-medium leading-tight",
                    theme === th.value ? "text-primary" : "text-on-surface",
                  )}>
                    {th.label}
                  </span>
                  {theme === th.value && (
                    <div className="absolute top-2 right-2">
                      <Icon name="check_circle" filled className="text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ── Preview ── */}
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-outline-variant/30 space-y-3">
            <h2 className="text-h3 font-h3 text-on-surface">Preview</h2>
            <div className="flex flex-wrap gap-2">
              <div className="px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium">Primary</div>
              <div className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-body-sm font-medium">Secondary</div>
              <div className="px-4 py-2 rounded-lg bg-tertiary text-on-tertiary text-body-sm font-medium">Tertiary</div>
              <div className="px-4 py-2 rounded-lg bg-error text-on-error text-body-sm font-medium">Error</div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-body-sm border border-outline-variant/40">Surface Container</div>
              <div className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-body-sm">Primary Container</div>
              <div className="px-4 py-2 rounded-lg bg-secondary-container text-on-secondary-container text-body-sm">Secondary Container</div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
