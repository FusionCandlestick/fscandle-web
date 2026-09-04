import { asset } from "../../lib/asset";
import { cn } from "./styles";

/**
 * The FusionCandlestick logo lockup: the transparent spherical mark, then the
 * name in two lines set solid — "Fusion" in the logo red, "Candlestick" in the
 * logo green, in Outfit (--font-display). The wordmark block is the exact
 * height of the mark and butts against it with no gap; the swirl is anchored
 * low-left, so the space between mark and text is built into the artwork.
 *
 * `size` is the mark's edge length in px. Pass `markOnly` for square slots.
 */
export function Wordmark({
  size = 32,
  markOnly = false,
  className,
}: {
  size?: number;
  markOnly?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span
        aria-hidden
        className="block shrink-0 bg-center bg-no-repeat [background-size:contain]"
        style={{ width: size, height: size, backgroundImage: `url(${asset("/logo.svg")})` }}
      />
      {!markOnly && (
        <span
          aria-hidden
          className="flex flex-col justify-center font-semibold leading-[0.8] tracking-[-0.035em]"
          style={{ fontFamily: "var(--font-display)", fontSize: size * 0.6 }}
        >
          <span style={{ color: "#FF5A5A" }}>Fusion</span>
          <span style={{ color: "#008755" }}>Candlestick</span>
        </span>
      )}
      <span className="sr-only">FusionCandlestick</span>
    </span>
  );
}
