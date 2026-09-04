"use client";

import { useState } from "react";
import Link from "next/link";
import { CandlestickChart, Menu, X } from "lucide-react";

import { GitHubIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import { button, cn, surface } from "./styles";

const NAV_LINKS = [
  { href: "#showcase-series", label: "Series" },
  { href: "#showcase-indicators", label: "Indicators" },
  { href: "#showcase-compare", label: "Compare" },
  { href: "#showcase-drawing", label: "Drawing" },
  { href: "#faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        surface.chrome,
        "bg-[var(--lp-header-bg)]",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 min-[1000px]:px-12">
        <Link href="/" aria-label="FusionCandlestick home" className="flex items-center rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lp-focus-ring)]">
          <Wordmark size={30} />
        </Link>

        <nav className="hidden items-center gap-1 min-[1000px]:flex" aria-label="Main Navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={button("ghost", "touch", "px-3.5")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/FusionCandlestick/fscandle"
            target="_blank"
            rel="noopener noreferrer"
            className={button("ghost", "touch", "hidden md:inline-flex")}
            aria-label="View source on GitHub"
          >
            <GitHubIcon size={17} />
          </a>
          <ThemeToggle />
          <Link href="/playground" className={cn(button("primary", "touch", "hidden gap-1.5 px-4 font-semibold sm:inline-flex"))}>
            <CandlestickChart size={16} />
            Playground
          </Link>
          <button
            type="button"
            className={cn(button("subtle", "touch", "md:hidden"))}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="lp-mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="lp-mobile-nav"
          className={cn("flex flex-col gap-1 border-t px-5 py-3 md:hidden", surface.chrome)}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={button("ghost", "touch", "w-full justify-start px-3")}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/playground"
            onClick={() => setMenuOpen(false)}
            className={cn(button("primary", "touch", "mt-2 justify-center gap-1.5 font-semibold"))}
          >
            <CandlestickChart size={16} />
            Playground
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
