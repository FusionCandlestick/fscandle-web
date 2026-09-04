import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { FAQ_ITEMS } from "./components/landing/faq-data";

// Outfit is the brand wordmark face (geometric, OFL). Exposed as --font-display
// for the logo lockup and headings; body copy stays on the system stack the
// chart engine also draws with.
const outfit = Outfit({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://fusioncandlestick.dev"),
  title: {
    default: "FusionCandlestick — Canvas K-Line Chart Engine & Financial Workspace",
    template: "%s | FusionCandlestick",
  },
  description:
    "A non-commercial source-available HTML5 Canvas K-line chart engine and financial terminal shell with multi-pane layouts, precision drawing tools, high-DPI rendering, and a single Canvas render loop.",
  applicationName: "FusionCandlestick",
  keywords: [
    "candlestick chart",
    "k-line engine",
    "financial charting library",
    "canvas kline",
    "technical analysis",
    "quantitative trading",
    "tradingview lightweight charts alternative",
    "klinecharts alternative",
    "nextjs financial terminal",
    "react charting component",
  ],
  authors: [{ name: "FusionCandlestick contributors" }],
  creator: "FusionCandlestick",
  publisher: "FusionCandlestick",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fusioncandlestick.dev",
    siteName: "FusionCandlestick",
    title: "FusionCandlestick — Canvas K-Line Engine & Terminal Shell",
    description:
      "A free-form HTML5 Canvas K-line charting engine with 8 series renderers, 16 indicators, precision drawing tools, and a synchronized multi-panel financial terminal workspace.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FusionCandlestick — Canvas Financial Chart Engine",
    description:
      "Non-commercial source-available HTML5 Canvas K-line engine with 8 series renderers, 16 indicators, and a multi-panel workspace shell.",
  },
  alternates: {
    canonical: "https://fusioncandlestick.dev",
  },
  category: "technology",
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://fusioncandlestick.dev/#website",
      url: "https://fusioncandlestick.dev",
      name: "FusionCandlestick",
      description: "High-Performance Canvas K-Line Engine & Financial Workspace",
      publisher: {
        "@type": "Organization",
        name: "FusionFinance",
        url: "https://fusioncandlestick.dev",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://fusioncandlestick.dev/#software",
      name: "FusionCandlestick",
      operatingSystem: "Any (modern web browser)",
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "Financial charting library",
      softwareVersion: "0.1.0",
      license: "https://github.com/FusionCandlestick/fscandle/blob/main/LICENSE",
      url: "https://fusioncandlestick.dev",
      sameAs: ["https://github.com/FusionCandlestick/fscandle"],
      description:
        "Non-commercial source-available HTML5 Canvas K-line chart engine, terminal shell, and synchronized playground workspace for financial and quantitative applications.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Custom HTML5 Canvas K-line renderer: candle, hollow, Heikin-Ashi, bar, area, line, step line, baseline, and volume modes",
        "16 built-in technical indicators (MA, EMA, BOLL, MACD, RSI, KDJ, WR, VOLMA, ATR, ADX, ROC, CCI, OBV, VWAP, STOCHRSI, PSAR)",
        "Multiple panes, multi-column price axes, synced charts, and overlay drawing tools with magnet snapping",
        "Declarative custom series via defineSeriesType and custom overlays via figure descriptors",
        "Timezone-aware axis labelling, session-aware gap compression, and bundled English and Chinese (Simplified & Traditional) locale dictionaries with a runtime registration API for any other language",
        "Single Canvas render loop with no per-bar DOM nodes and high-DPI aware drawing",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://fusioncandlestick.dev/#faq",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": "https://fusioncandlestick.dev/#source",
      name: "FusionCandlestick",
      codeRepository: "https://github.com/FusionCandlestick/fscandle",
      programmingLanguage: ["TypeScript", "CSS"],
      runtimePlatform: "Next.js 16, React 19",
      license: "https://github.com/FusionCandlestick/fscandle/blob/main/LICENSE",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
