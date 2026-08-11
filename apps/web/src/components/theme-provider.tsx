"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

import {
  readStored,
  subscribeToStorage,
  writeStored,
} from "@/lib/client-storage";
import {
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isAccent,
  isTheme,
  type Accent,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  accent: Accent;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const storedTheme = useSyncExternalStore(
    subscribeToStorage,
    () => readStored(THEME_STORAGE_KEY),
    () => null,
  );

  const storedAccent = useSyncExternalStore(
    subscribeToStorage,
    () => readStored(ACCENT_STORAGE_KEY),
    () => null,
  );

  const theme = isTheme(storedTheme) ? storedTheme : DEFAULT_THEME;
  const accent = isAccent(storedAccent) ? storedAccent : DEFAULT_ACCENT;

  const setTheme = useCallback((next: Theme) => {
    writeStored(THEME_STORAGE_KEY, next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
  }, []);

  const setAccent = useCallback((next: Accent) => {
    writeStored(ACCENT_STORAGE_KEY, next);
    document.documentElement.dataset.accent = next;
  }, []);

  const value = useMemo(
    () => ({ theme, accent, setTheme, setAccent }),
    [theme, accent, setTheme, setAccent],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }
  return context;
}
