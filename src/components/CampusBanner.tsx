"use client";

import { useEffect, useRef } from "react";
import type { SiteContent } from "@/types/content";

/** Vertical slices the band is revealed through, spread across its width. */
const SLICES = 8;
/** Each slice starts wiping this much later in the scroll progress. */
const STAGGER = 0.07;
/** How much scroll progress one slice takes to wipe fully. */
const WIPE = 0.45;

/**
 * Full-bleed campus band, 400px tall and 600px from 1200px up, carrying a
 * muted, looping, control-less video (the photo is its poster, so the band
 * still reads when the file is missing or autoplay is refused).
 *
 * The reveal is scroll-linked rather than a one-shot: as the band comes up
 * the page, eight white slices peel off it one after another, alternating
 * from the top and from the bottom, and the video drifts a little slower
 * than the page. Progress is written to two custom properties on the
 * wrapper (`--p` for the wipe, `--q` for the parallax) from a scroll
 * listener throttled to one frame, and the slices' transforms are pure CSS
 * on top of `--p`, so nothing re-renders on scroll. The video plays only
 * while it is on screen. Under reduced motion the band is shown revealed
 * and still, on its poster.
 */
export default function CampusBanner({
  content,
}: {
  content: SiteContent["banner"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.style.setProperty("--p", "1");
      el.style.setProperty("--q", "0.5");
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      /* 0 as the band's top edge enters at the bottom of the screen, 1 once
         it has climbed the lower three quarters of it. */
      const p = Math.min(Math.max((vh - r.top) / (vh * 0.75), 0), 1);
      /* 0→1 across the band's whole pass through the viewport. */
      const q = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
      el.style.setProperty("--p", p.toFixed(4));
      el.style.setProperty("--q", q.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "100px 0px" },
    );
    io.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative h-100 w-full overflow-hidden bg-surface xl:h-150"
      style={{ "--p": 0, "--q": 0 } as React.CSSProperties}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        poster="/images/banner-campus-life.jpg"
        aria-label={content.imageAlt}
        className="absolute inset-0 h-full w-full scale-[1.18] object-cover will-change-transform"
        style={{
          /* ±9% drift over the pass; the 1.18 scale keeps the edges covered. */
          transform: "translateY(calc((var(--q) - 0.5) * 18%)) scale(1.18)",
        }}
      >
        <source src="/videos/campus-life.mp4" type="video/mp4" />
        <source src="/videos/campus-life.webm" type="video/webm" />
      </video>

      {/* Slices: each shrinks to nothing as --p passes its start */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex">
        {Array.from({ length: SLICES }, (_, i) => {
          const end = (i * STAGGER + WIPE).toFixed(3);
          return (
            <span
              key={i}
              className="-me-px block h-full flex-1 bg-white will-change-transform last:me-0"
              style={{
                transformOrigin: i % 2 ? "bottom" : "top",
                transform: `scaleY(clamp(0, calc((${end} - var(--p)) / ${WIPE}), 1))`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
