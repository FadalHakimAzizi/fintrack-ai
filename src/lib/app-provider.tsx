"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Locale, type ThemeName, type Mode, getTranslation } from "@/lib/i18n";

interface AppCtx {
  locale: Locale;
  theme: ThemeName;
  mode: Mode;
  sidebarOpen: boolean;
  collapsed: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleCollapsed: () => void;
  setLocale: (l: Locale) => void;
  setTheme: (t: ThemeName) => void;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  t: (path: string) => string;
}

const AppContext = createContext<AppCtx>({
  locale: "id", theme: "ocean", mode: "light", sidebarOpen: false, collapsed: false,
  setLocale: () => {}, setTheme: () => {}, setMode: () => {}, toggleMode: () => {},
  setSidebarOpen: () => {}, toggleCollapsed: () => {}, t: (p) => p,
});

function applyToDOM(locale: Locale, theme: ThemeName, mode: Mode) {
  const h = document.documentElement;
  h.classList.toggle("dark", mode === "dark");
  if (theme === "ocean") h.removeAttribute("data-theme");
  else h.setAttribute("data-theme", theme);
  h.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
  h.setAttribute("lang", locale);
  // Cookie so server components can read locale
  document.cookie = `locale=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");
  const [theme, setThemeState] = useState<ThemeName>("ocean");
  const [mode, setModeState] = useState<Mode>("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const l = (localStorage.getItem("locale") as Locale) || "id";
    const t = (localStorage.getItem("theme") as ThemeName) || "ocean";
    const m = (localStorage.getItem("mode") as Mode) || "light";
    const c = localStorage.getItem("sidebarCollapsed") === "true";
    setLocaleState(l); setThemeState(t); setModeState(m); setCollapsed(c);
    applyToDOM(l, t, m);
    document.documentElement.style.setProperty("--sidebar-w", c ? "5rem" : "16rem");
  }, []);

  const toggleCollapsed = () => {
    const v = !collapsed;
    setCollapsed(v);
    localStorage.setItem("sidebarCollapsed", String(v));
    document.documentElement.style.setProperty("--sidebar-w", v ? "5rem" : "16rem");
  };

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    applyToDOM(l, theme, mode);
  };
  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    applyToDOM(locale, t, mode);
  };
  const setMode = (m: Mode) => {
    setModeState(m);
    localStorage.setItem("mode", m);
    applyToDOM(locale, theme, m);
  };
  const toggleMode = () => setMode(mode === "light" ? "dark" : "light");

  const t = (path: string) => getTranslation(locale, path);

  return (
    <AppContext.Provider value={{ locale, theme, mode, sidebarOpen, collapsed, setSidebarOpen, toggleCollapsed, setLocale, setTheme, setMode, toggleMode, t }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
