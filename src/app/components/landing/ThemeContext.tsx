"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { LANDING_THEMES, type LandingThemeTokens, type ThemeMode } from "./tokens";

interface LandingThemeContextValue {
  themeMode: ThemeMode;
  theme: LandingThemeTokens;
  setThemeMode: (updater: ThemeMode | ((mode: ThemeMode) => ThemeMode)) => void;
}

const LandingThemeContext = createContext<LandingThemeContextValue | null>(null);

export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const value = useMemo(
    () => ({ themeMode, theme: LANDING_THEMES[themeMode], setThemeMode }),
    [themeMode],
  );

  return <LandingThemeContext.Provider value={value}>{children}</LandingThemeContext.Provider>;
}

export function useLandingTheme(): LandingThemeContextValue {
  const ctx = useContext(LandingThemeContext);
  if (!ctx) throw new Error("useLandingTheme must be used within LandingThemeProvider");
  return ctx;
}
