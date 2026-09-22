"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { SiteContent } from "@/types/content";

/** Milliseconds the intro is shown at minimum, and at most, before leaving. */
const MIN_SHOW = 1300;
const MAX_SHOW = 2600;
/** Content fade (300) + the stagger across all slats (280) + slat lift (700). */
const LEAVE = 1300;
/** Rendered count; the CSS shows 5 of them below 1200px and all 12 above. */
const SLATS = 12;

const STORAGE_KEY = "uowa-preloaded";
const noop = () => () => {};

/**
 * First-visit intro: a navy screen where the emblem settles in, the wordmark
 * rises under it and a hairline fills while the page finishes loading. It
 * leaves by fading the mark out and lifting the navy slats (five on phones,
 * twelve from 1200px) one after another, which is the same curtain the page transitions use, so the site
 * opens the way it later moves between pages.
 *
 * It runs once per browser session. An inline script in the document head
 * (see the root layout) marks `<html data-preloaded>` before first paint when
 * the session has already seen it, and the CSS hides this element under that
 * attribute, so returning visitors never see a flash of navy. The same
 * script sets `data-loading`, which pauses the hero's entrance animations
 * until the intro has lifted, so they play into a visible page.
 */
export default function Preloader({ brand }: { brand: SiteContent["brand"] }) {
  const skipped = useSyncExternalStore(
    noop,
    () => document.documentElement.hasAttribute("data-preloaded"),
    () => false,
  );
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");

  useEffect(() => {
    if (skipped) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    let leaveTimer = 0;
    let doneTimer = 0;

    const leave = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      setPhase("leaving");
      doneTimer = window.setTimeout(
        () => {
          document.documentElement.removeAttribute("data-loading");
          setPhase("done");
        },
        reduce ? 0 : LEAVE,
      );
    };
    const scheduleLeave = () => {
      const elapsed = performance.now() - started;
      leaveTimer = window.setTimeout(leave, Math.max(0, (reduce ? 0 : MIN_SHOW) - elapsed));
    };

    if (document.readyState === "complete") scheduleLeave();
    else window.addEventListener("load", scheduleLeave, { once: true });
    const cap = window.setTimeout(leave, MAX_SHOW);

    return () => {
      window.removeEventListener("load", scheduleLeave);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(cap);
    };
  }, [skipped]);

  if (skipped || phase === "done") return null;

  return (
    <div className="preloader" data-phase={phase} aria-hidden>
      <div className="preloader-slats">
        {Array.from({ length: SLATS }, (_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <div className="preloader-content">
        <Image
          src="/svg/uowa-mark-white.svg"
          alt=""
          width={41}
          height={64}
          priority
          className="preloader-mark h-16 w-auto"
        />
        <p className="preloader-word font-[family-name:var(--font-heading)] text-[26px] leading-tight text-white xl:text-[32px]">
          <span className="font-bold">{brand.name}</span>{" "}
          <span className="font-light">{brand.suffix}</span>
        </p>
        <p className="preloader-uni font-[family-name:var(--font-sans)] text-[12px] uppercase leading-5 tracking-[3px] text-pale">
          {brand.university}
        </p>
        <span className="preloader-line" />
      </div>
    </div>
  );
}
