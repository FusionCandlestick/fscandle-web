"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback } from "react";

import { useLandingTheme } from "./ThemeContext";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { iconButton } from "./styles";

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

/**
 * Wraps a theme-mode setter in `document.startViewTransition` so the toggle
 * expands as a circle from wherever the user clicked, rather than snapping.
 * Falls back to an instant swap — the only previous behavior — when the API
 * is unavailable or the user asked for reduced motion.
 */
function useViewTransitionTheme(setMode: (updater: (mode: "dark" | "light") => "dark" | "light") => void) {
  const reducedMotion = useReducedMotion();

  return useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const toggle = () => setMode((mode) => (mode === "dark" ? "light" : "dark"));
      const doc = document as DocumentWithViewTransition;

      if (reducedMotion || typeof doc.startViewTransition !== "function") {
        toggle();
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      document.documentElement.style.setProperty("--lp-vt-x", `${x}px`);
      document.documentElement.style.setProperty("--lp-vt-y", `${y}px`);

      doc.startViewTransition(toggle);
    },
    [reducedMotion, setMode],
  );
}

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useLandingTheme();
  const handleClick = useViewTransitionTheme(setThemeMode);
  const nextMode = themeMode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={iconButton("subtle", "touch")}
      aria-label={`Switch to ${nextMode} theme`}
      aria-pressed={themeMode === "dark"}
    >
      {themeMode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
