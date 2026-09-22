"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Slat rise (550) + the last slat's delay (4 × 50). */
const COVER = 760;
/** Slat lift (650) + the last slat's delay (4 × 50). */
const REVEAL = 860;
/** If the new route has not arrived by then, lift anyway. */
const STUCK = 4000;
const SLATS = 5;

type State = "idle" | "cover" | "covered" | "reveal";

/**
 * Curtain transition between pages. A click on an in-app link is caught in
 * the capture phase before Next's Link sees it; five navy slats rise from the
 * bottom one after another, the route is pushed once they meet the top, and
 * when the new pathname is in they lift away upward in the same order. The
 * new page's content also fades up under the lifting slats (`.page-in`,
 * keyed on the pathname), which is all that plays on back/forward navigation
 * and under reduced motion, where the curtain is skipped entirely.
 *
 * Only plain left clicks on same-origin links to a different path are taken
 * over: modified clicks, new-tab links, downloads, hash jumps on the same
 * page and external URLs keep the browser's own behaviour.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>("idle");
  const pending = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  /* Take over qualifying link clicks. */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (pending.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      pending.current = url.pathname + url.search + url.hash;
      setState("cover");
      later(() => {
        if (pending.current) router.push(pending.current);
      }, COVER);
      later(() => {
        /* Route never arrived (offline, error page): do not trap the page. */
        if (pending.current) {
          pending.current = null;
          setState("reveal");
          later(() => setState("idle"), REVEAL);
        }
      }, STUCK);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, later]);

  /* The new route is in: lift the curtain. */
  useEffect(() => {
    if (!pending.current) return;
    pending.current = null;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setState("covered");
    /* Two frames so the origin swap lands before the lift transition starts. */
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setState("reveal");
        later(() => setState("idle"), REVEAL);
      }),
    );
  }, [pathname, later]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  return (
    <>
      <div key={pathname} className="page-in">
        {children}
      </div>
      <div className="curtain" data-state={state} aria-hidden>
        {Array.from({ length: SLATS }, (_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </>
  );
}
