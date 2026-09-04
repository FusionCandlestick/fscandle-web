"use client";

import { Moon, Sun } from "lucide-react";

import { useLandingTheme } from "./ThemeContext";
import { useViewTransitionTheme } from "./hooks/useViewTransitionTheme";
import { iconButton } from "./styles";

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
