"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { CarouselArrowIcon } from "@/components/icons";

/**
 * Turns a row of cards into a swipeable slider below 1200px and leaves it
 * alone above. The track is a scroll-snap list that bleeds to the viewport
 * edges (undoing the page's 20px gutter) and pads 10vw either side, so each
 * 80vw-wide card snaps to the centre of the screen with its neighbours peeking
 * in; each child must be an `<li>` with `w-[80vw] shrink-0 snap-center` (vw,
 * not a percentage, which would resolve against the padded content box). Under
 * the track a counter and previous/next arrows step the track one card at a
 * time; both are hidden from 1200px, where `className` restores the desktop
 * layout.
 *
 * Every offset is a delta between the card's centre and the track's centre in
 * viewport pixels, and `scrollBy` takes physical pixels, so the same code
 * scrolls correctly under RTL without a sign flip.
 */
export default function PhoneSlider({
  children,
  prev,
  next,
  className = "",
  controlsClassName = "",
}: {
  children: React.ReactNode;
  prev: string;
  next: string;
  /** Extra classes on the track, mostly `xl:` overrides for the desktop layout. */
  className?: string;
  controlsClassName?: string;
}) {
  const count = Children.count(children);
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  /** How far the card's centre sits from the track's centre, in viewport px. */
  const offsetOf = useCallback((track: HTMLUListElement, card: Element) => {
    const t = track.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    return c.left + c.width / 2 - (t.left + t.width / 2);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const target = Math.min(Math.max(i, 0), count - 1);
      const card = track.children[target];
      if (!card) return;
      track.scrollBy({ left: offsetOf(track, card), behavior: "smooth" });
    },
    [count, offsetOf],
  );

  /** Keep the counter honest when the track is dragged or flicked directly. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let best = 0;
        let bestDist = Infinity;
        Array.from(track.children).forEach((card, i) => {
          const d = Math.abs(offsetOf(track, card));
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        setIndex(best);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [offsetOf]);

  const atStart = index <= 0;
  const atEnd = index >= count - 1;

  return (
    <div className="w-full">
      <ul
        ref={trackRef}
        data-lenis-prevent
        className={`-mx-5 flex w-[calc(100%+40px)] snap-x snap-mandatory list-none gap-4 overflow-x-auto overflow-y-hidden px-[10vw] py-1 [-ms-overflow-style:none] [scrollbar-width:none] xl:mx-0 xl:w-full xl:snap-none xl:overflow-visible xl:px-0 xl:py-0 [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </ul>

      {count > 1 ? (
        <div
          className={`mt-6 flex w-full items-center justify-between xl:hidden ${controlsClassName}`}
        >
          <p
            dir="ltr"
            className="font-[family-name:var(--font-sans)] text-[12px] leading-[18px] tracking-[2px] text-muted"
          >
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={prev}
              disabled={atStart}
              onClick={() => goTo(index - 1)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-navy text-navy transition-opacity duration-200 hover:opacity-80 disabled:cursor-default disabled:opacity-30"
            >
              <CarouselArrowIcon direction="left" className="rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              aria-label={next}
              disabled={atEnd}
              onClick={() => goTo(index + 1)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-navy text-navy transition-opacity duration-200 hover:opacity-80 disabled:cursor-default disabled:opacity-30"
            >
              <CarouselArrowIcon direction="right" className="rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
