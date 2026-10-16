"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import { CarouselArrowIcon } from "@/components/icons";
import { dirOf, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/**
 * The centre's milestones as a carousel across the full width of the page.
 *
 * The label and heading open the section, with the previous/next arrows at
 * the end of the same row; under them the cards run in one snapping row,
 * four to a screen from 1200px, two from 768px and one and a bit on phones
 * (the next card peeks in, so the row reads as swipeable). Each card is a
 * 4:3 photo over a tinted panel with the year, the title and the summary;
 * cards in a row share one height.
 *
 * The arrows move one card at a time and fade out at either end. Under RTL a
 * scroller counts `scrollLeft` from 0 down to negative values, so each step
 * is multiplied by the direction sign and the ends are judged by magnitude.
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
  const [ends, setEnds] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const scrolled = Math.abs(el.scrollLeft);
    setEnds({ start: scrolled < 4, end: scrolled >= el.scrollWidth - el.clientWidth - 4 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: sign * dir * (card.offsetWidth + gap), behavior: "smooth" });
  };

  const heading = content.heading.filter(Boolean);
  const arrow =
    "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-navy text-white transition-opacity duration-200 hover:opacity-85 disabled:cursor-default disabled:opacity-25";

  return (
    <section id="milestones" className="mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 py-14 xl:px-25 xl:py-[112px]">
      <div className="flex w-full items-end justify-between gap-6">
        <div className="flex flex-col items-start gap-4">
          <SectionLabel className="text-navy">{content.label}</SectionLabel>
          {heading.length ? (
            <h2 className="t-h2">
              {heading.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button type="button" aria-label={content.prev} onClick={() => step(-1)} disabled={ends.start} className={arrow}>
            <CarouselArrowIcon direction={rtl ? "right" : "left"} />
          </button>
          <button type="button" aria-label={content.next} onClick={() => step(1)} disabled={ends.end} className={arrow}>
            <CarouselArrowIcon direction={rtl ? "left" : "right"} />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        onScroll={measure}
        data-lenis-prevent
        className="mt-8 flex snap-x snap-mandatory list-none items-stretch gap-4 overflow-x-auto overflow-y-hidden p-0 [-ms-overflow-style:none] [scrollbar-width:none] xl:mt-12 xl:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {content.items.map((item, i) => (
          <li
            key={`${item.year}-${i}`}
            className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-16px)/2)] xl:w-[calc((100%-72px)/4)]"
          >
            <article className="flex h-full flex-col">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 639px) 82vw, (max-width: 1199px) 50vw, 330px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col items-start gap-2 border-t-[3px] border-gold bg-surface p-5 xl:p-6">
                <span className="font-[family-name:var(--font-sans)] text-[14px] font-semibold leading-6 text-navy/70 xl:text-[15px]">{item.year}</span>
                <h3 className="t-h4 text-[18px] leading-7 xl:text-[20px] xl:leading-8">{item.title}</h3>
                <p className="t-body text-[14px] leading-7 xl:text-[15px]">{item.summary}</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
