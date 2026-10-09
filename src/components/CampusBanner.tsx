"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/types/content";

/** Vertical slices the band is revealed through, spread across its width. */
const SLICES = 8;

/**
 * Full-bleed campus band, 400px tall and 600px from 1200px up, carrying a
 * muted, looping, control-less video: the first half of the campus footage,
 * trimmed to 20s at 30fps with the audio dropped, in MP4 and WebM. Its first
 * frame is the poster, so the band still reads when autoplay is refused.
 *
 * The reveal plays once, like every section's entrance: the first time a
 * quarter of the band is on screen, eight white slices peel off it one
 * after another, alternating from the top and from the bottom, and they
 * stay gone. (It used to follow the scroll position and replay in reverse
 * on the way back up, with a parallax drift; both are gone.) The video
 * plays only while the band is on screen. Under reduced motion the band is
 * shown revealed and still, on its poster.
 */
export default function CampusBanner({
  content,
}: {
  content: SiteContent["banner"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveal = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          reveal.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    reveal.observe(el);

    const play = new IntersectionObserver(
      ([entry]) => {
        if (reduce) return;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "100px 0px" },
    );
    play.observe(el);

    return () => {
      reveal.disconnect();
      play.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="relative h-100 w-full overflow-hidden bg-surface xl:h-150">
      <video
        key={content.video}
        ref={videoRef}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        poster={content.poster || "/images/banner-video-poster.jpg"}
        aria-label={content.imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={content.video || "/videos/campus-life.mp4"} type="video/mp4" />
        {content.videoWebm ? <source src={content.videoWebm} type="video/webm" /> : null}
      </video>

      {/* Slices: full height until the band is revealed, then each wipes away
          on its own delay. */}
      <div aria-hidden className="banner-slices pointer-events-none absolute inset-0 flex" data-revealed={revealed}>
        {Array.from({ length: SLICES }, (_, i) => (
          <span
            key={i}
            className="-me-px block h-full flex-1 bg-white last:me-0"
            style={{ transformOrigin: i % 2 ? "bottom" : "top", transitionDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
