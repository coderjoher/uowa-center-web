"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import { CarouselArrowIcon } from "@/components/icons";
import { dirOf, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/** Card width 313 + 10px gap. */
const CARD_PITCH = 323;

/**
 * Click-driven horizontal carousel. The track is a 735-wide overflow-hidden
 * viewport; cards are 313 wide with a 10px gap. Prev/next are 40x40 navy
 * circles inset 20px from the track edges.
 *
 * The viewport height is deliberately NOT pinned. It used to be 490px, taken
 * from a layout whose card summary was one line; Arabic wraps to two, which
 * made every card 528px and clipped 38px off the bottom. The track now sizes to
 * its content and `items-stretch` keeps the cards level.
 *
 * RTL note: per the CSSOM spec a right-to-left scroller reports `scrollLeft`
 * as 0 at the start and counts *down* toward the end, so every offset is
 * multiplied by the direction sign rather than used raw.
 */
export default function MilestonesSection({
  content,
  lang,
}: {
  content: SiteContent["milestones"];
  lang: Locale;
}) {
  const rtl = dirOf(lang) === "rtl";
  const sign = rtl ? -1 : 1;

  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  /** How many 323px steps the track can take at the current width. */
  const maxIndex = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    return Math.max(0, Math.ceil((el.scrollWidth - el.clientWidth) / CARD_PITCH));
  }, []);

  const [limit, setLimit] = useState(0);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setLimit(maxIndex());
    update();
    // The track is only measurable once the cards have laid out.
    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [maxIndex]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      const next = Math.min(Math.max(index + dir, 0), maxIndex());
      setIndex(next);
      el.scrollTo({ left: sign * next * CARD_PITCH, behavior: "smooth" });
    },
    [index, maxIndex, sign],
  );

  /** Keep the arrows honest when the track is dragged or flicked directly. */
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(Math.abs(el.scrollLeft) / CARD_PITCH));
  }, []);

  const atStart = index <= 0;
  const atEnd = index >= limit;

  return (
    <section
      id="milestones"
      className="relative flex scroll-mt-24 flex-col items-center py-14 xl:gap-[85px] xl:py-[140px]"
    >
      <div className="relative mx-auto flex w-full max-w-[1520px] flex-col items-start justify-between gap-8 px-5 xl:flex-row xl:px-25">
        <div className="flex w-full max-w-[420px] flex-col items-start gap-4">
          <SectionLabel className="text-navy">{content.label}</SectionLabel>
          <h2 className="t-h2">
            {content.heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative w-full overflow-hidden xl:w-[735px]">
          <ul
            ref={trackRef}
            onScroll={onScroll}
            data-lenis-prevent
            className="flex list-none items-stretch gap-2.5 overflow-x-auto overflow-y-hidden p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {content.items.map((item) => (
              <li key={item.year} className="w-[313px] shrink-0">
                <div className="flex h-full flex-col items-start">
                  <div className="relative h-[336px] w-[313px]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="313px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex w-full flex-1 flex-col items-start gap-3 bg-surface p-6">
                    <SectionLabel className="text-navy">{item.year}</SectionLabel>
                    <div className="flex flex-col items-start gap-1">
                      <h4 className="t-h4">{item.title}</h4>
                      <p className="t-body-lg">{item.summary}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-5">
            <button
              type="button"
              aria-label={content.prev}
              onClick={() => step(-1)}
              style={{ opacity: atStart ? 0 : 1, pointerEvents: atStart ? "none" : "auto" }}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-navy text-white transition-opacity duration-200 hover:opacity-85"
            >
              <CarouselArrowIcon direction={rtl ? "right" : "left"} />
            </button>
            <button
              type="button"
              aria-label={content.next}
              onClick={() => step(1)}
              style={{ opacity: atEnd ? 0 : 1, pointerEvents: atEnd ? "none" : "auto" }}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-navy text-white transition-opacity duration-200 hover:opacity-85"
            >
              <CarouselArrowIcon direction={rtl ? "left" : "right"} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
