"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const STORAGE_KEY = "tsr-lang";

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") {
      setLang(stored);
      return;
    }
    const browserLang = window.navigator.language || "en";
    if (browserLang.toLowerCase().startsWith("es")) {
      setLang("es");
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "es" : "en";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ lang, toggleLang }), [lang, toggleLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

// Helper for pulling a { en, es } object down to the active language string.
export function useT() {
  const { lang } = useLanguage();
  return useCallback((field) => field[lang] ?? field.en, [lang]);
}
