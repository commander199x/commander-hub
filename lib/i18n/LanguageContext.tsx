"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, translations, type Locale } from "./translations";

const STORAGE_KEY = "commander-locale";

interface LanguageContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  /** Look up a translation by dot path, e.g. t("nav.home") */
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  // Read saved preference (or browser language) once on mount, client-side only.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "ar") {
        setLocaleState(saved);
      } else if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar")) {
        setLocaleState("ar");
      }
    } catch {
      // localStorage can be unavailable (private browsing, etc.) — fall back to default silently
    } finally {
      setHydrated(true);
    }
  }, []);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  // Keep the <html> tag's lang/dir attributes in sync with the chosen language.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write failures
    }
  };

  const toggleLocale = () => setLocale(locale === "en" ? "ar" : "en");

  const t = useMemo(() => {
    return (path: string) => {
      const value = getByPath(translations[locale], path);
      if (typeof value === "string") return value;
      // Fall back to English so the UI never shows a raw key while translations are incomplete.
      const fallback = getByPath(translations[DEFAULT_LOCALE], path);
      return typeof fallback === "string" ? fallback : path;
    };
  }, [locale]);

  const value = useMemo(
    () => ({ locale, dir, setLocale, toggleLocale, t }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, dir, t]
  );

  // Avoid a language flash: render nothing different pre-hydration, the
  // provider still renders children immediately with the default locale.
  void hydrated;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
