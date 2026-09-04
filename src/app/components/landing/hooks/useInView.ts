"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  rootMargin?: string;
  /** Stop observing after the first time the target enters the viewport. */
  once?: boolean;
}

/**
 * Drives two independent jobs off one observer: gating when a demo chart
 * mounts (real cost — a canvas render loop) and when a section's reveal
 * animation fires (cheap, but reusing the same signal avoids running two
 * IntersectionObservers per section for no reason).
 */
/** SSR has no `window`, so this is `false` there and on any client that
 * actually supports `IntersectionObserver` — the mismatch only surfaces on
 * a browser with neither, which degrades to "always visible" anyway. */
const observerUnsupported = () => typeof window !== "undefined" && typeof IntersectionObserver === "undefined";

export function useInView<T extends Element>({
  rootMargin = "200px 0px",
  once = true,
}: UseInViewOptions = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(observerUnsupported);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        setInView(true);
        if (once) observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, once]);

  return { ref, inView };
}
