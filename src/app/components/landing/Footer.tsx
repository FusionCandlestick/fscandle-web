import Link from "next/link";
import { ArrowUpRight, Mail, MessageSquare } from "lucide-react";

import { GitHubIcon } from "./icons";
import { Wordmark } from "./Wordmark";
import { cn, surface, text } from "./styles";

const REPO = "https://github.com/FusionCandlestick/fscandle";

export function Footer() {
  return (
    <footer className={cn("border-t border-[color:var(--lp-border)]", surface.chrome)}>
      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 min-[1000px]:px-12 min-[1000px]:py-12">
        <div className="grid grid-cols-[1.5fr_0.7fr_1fr] gap-4 sm:gap-8 min-[1000px]:gap-12">
          <div className="min-w-0 max-w-md">
            <Link href="/" aria-label="FusionCandlestick home" className="inline-flex rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lp-focus-ring)]">
              <Wordmark size={34} />
            </Link>
            <p className={cn("mt-3 text-[12px] leading-[1.4]", text.muted)}>
              A high-performance source-available Canvas charting engine for financial products, market data, and quantitative applications.
            </p>
            <p className={cn("mt-5 text-[12px] leading-[1.4]", text.muted)}>
              © 2026 FusionCandlestick. Non-commercial source license.
            </p>
          </div>

          <div className="min-w-0">
            <h2 className={cn("text-[12px] font-semibold", text.main)}>Explore</h2>
            <nav className="mt-4 flex flex-col items-start gap-3 text-[12px]">
              <Link href="/playground" className={cn(text.muted, "outline-none transition-colors hover:text-[color:var(--lp-text-main)] focus-visible:text-[color:var(--lp-text-main)]")}>Playground</Link>
              <a href="#showcase-series" className={cn(text.muted, "outline-none transition-colors hover:text-[color:var(--lp-text-main)] focus-visible:text-[color:var(--lp-text-main)]")}>Features</a>
              <a href="#faq" className={cn(text.muted, "outline-none transition-colors hover:text-[color:var(--lp-text-main)] focus-visible:text-[color:var(--lp-text-main)]")}>FAQ</a>
            </nav>
          </div>

          <div className="min-w-0">
            <h2 className={cn("text-[12px] font-semibold", text.main)}>Contact & Community</h2>
            <div className="mt-4 flex flex-col items-start gap-3 text-[12px]">
              <a href={REPO} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-2 outline-none transition-colors", text.muted, "hover:text-[color:var(--lp-text-main)] focus-visible:text-[color:var(--lp-text-main)]")}>
                <GitHubIcon /> GitHub <ArrowUpRight size={13} />
              </a>
              <a href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-2 outline-none transition-colors", text.muted, "hover:text-[color:var(--lp-text-main)] focus-visible:text-[color:var(--lp-text-main)]")}>
                <MessageSquare size={16} /> Issues & Feedback
              </a>
              <a href={`${REPO}/discussions`} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-2 outline-none transition-colors", text.muted, "hover:text-[color:var(--lp-text-main)] focus-visible:text-[color:var(--lp-text-main)]")}>
                <Mail size={16} /> Community contact
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
