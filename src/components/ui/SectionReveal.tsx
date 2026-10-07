"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Gives every section of the page a one-time entrance: the first time a
 * section scrolls into view it fades and rises into place, and from then on
 * it stays put — no replay on the way back up. The hero, the header and
 * anything already on screen when the page opens are left alone (they have
 * the intro and the page fade), so nothing visible ever blinks out.
 *
 * It works on the page's existing markup — the direct children of `<main>` —
 * so a section added from the admin gets the same entrance with no extra
 * wiring. The styles are `[data-sec]` in globals.css; reduced motion skips
 * it entirely.
 */
export default function SectionReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.querySelector("main");
    if (!main) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.sec = "shown";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    const fold = window.innerHeight;
    for (const el of Array.from(main.children) as HTMLElement[]) {
      if (el.tagName === "HEADER" || el.dataset.sec) continue;
      if (el.getBoundingClientRect().top < fold) continue;
      el.dataset.sec = "pending";
      io.observe(el);
    }
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
