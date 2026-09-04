"use client";

import "./components/landing/landing.css";

import { LandingThemeProvider, useLandingTheme } from "./components/landing/ThemeContext";
import { landingThemeCssVars } from "./components/landing/tokens";
import { SiteHeader } from "./components/landing/SiteHeader";
import { Hero } from "./components/landing/Hero";
import { Footer } from "./components/landing/Footer";
import { SeriesShowcase } from "./components/landing/sections/SeriesShowcase";
import { IndicatorShowcase } from "./components/landing/sections/IndicatorShowcase";
import { CompareShowcase } from "./components/landing/sections/CompareShowcase";
import { DrawingShowcase } from "./components/landing/sections/DrawingShowcase";
import { FAQSection } from "./components/landing/sections/FAQSection";

function LandingPageContent() {
  const { theme } = useLandingTheme();

  return (
    <div
      data-lp-root
      style={landingThemeCssVars(theme)}
      className="min-h-screen bg-[var(--lp-shell-bg)] text-[color:var(--lp-text-main)] relative selection:bg-blue-500/20"
    >
      {/* Delicate graph-paper grid spanning the entire page */}
      <div className="lp-grid-bg pointer-events-none fixed inset-0 z-0" aria-hidden />

      <SiteHeader />

      {/* Hero Section */}
      <Hero theme={theme} />

      {/* Main Content Showcase Sections */}
      <main id="main-content" className="lp-showcase-wrapper mx-auto max-w-[1600px] px-4 min-[1000px]:px-12 flex flex-col gap-2 min-[1000px]:gap-4 pb-12">
        {/* Row 1: Series Showcase */}
        <section id="showcase-series" aria-label="Native Series Renderers" className="lp-showcase-row">
          <SeriesShowcase theme={theme} />
        </section>

        {/* Row 2: Indicators Showcase */}
        <section id="showcase-indicators" aria-label="Technical Indicators Engine" className="lp-showcase-row">
          <IndicatorShowcase theme={theme} />
        </section>

        {/* Row 3: Compare Showcase */}
        <section id="showcase-compare" aria-label="Benchmark Comparison" className="lp-showcase-row">
          <CompareShowcase theme={theme} />
        </section>

        {/* Row 4: Drawing Showcase */}
        <section id="showcase-drawing" aria-label="Geometric Drawing & Overlays" className="lp-showcase-row">
          <DrawingShowcase theme={theme} />
        </section>

        {/* FAQ & Q&A Section */}
        <section id="faq" aria-label="Frequently Asked Questions & Q&A" className="lp-showcase-row">
          <FAQSection />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function LandingPage() {
  return (
    <LandingThemeProvider>
      <LandingPageContent />
    </LandingThemeProvider>
  );
}

