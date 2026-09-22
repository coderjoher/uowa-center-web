"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import { ArrowUpRightIcon, CarouselArrowIcon } from "@/components/icons";
import { dirOf, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/**
 * Services slider. Selecting a row in the list — or stepping with the arrows
 * on the card — swaps the panel: the photos are stacked and cross-fade on
 * opacity while the incoming one settles from a slight scale, and the navy
 * card's copy remounts on `key` and plays the `.panel-in` keyframe, so the
 * halves stay in step without any timers.
 *
 * From 1200px the section is two columns: a 480px column with the heading
 * and a numbered, ruled list (gold numerals; the active row is navy with a
 * gold arrow, the rest muted), and a photo panel that fills the remaining
 * width at the column's height (600px at least). The navy card sits on the panel's bottom-start corner
 * with a gold edge and carries the active title, its description, an
 * `01 / 06` counter and the previous/next arrows.
 *
 * Below 1200px it is a phone slider: the six titles run as a horizontal
 * strip of chips under the heading (the active one scrolls into view), the
 * photo drops to 4:3, and the same navy card sits under it in flow.
 */
export default function ServicesSection({
  content,
  lang,
}: {
  content: SiteContent["services"];
  lang: Locale;
}) {
  const rtl = dirOf(lang) === "rtl";
  const [active, setActive] = useState(0);
  const count = content.items.length;
  const current = content.items[active];

  const stripRef = useRef<HTMLUListElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Centre the active chip in the strip. The strip may be above the fold when
     an arrow under the photo is tapped, so the scroll is a horizontal delta on
     the strip itself rather than scrollIntoView, which would also drag the
     page. A delta works the same under RTL, where scrollLeft runs negative. */
  useEffect(() => {
    const strip = stripRef.current;
    const chip = chipRefs.current[active];
    if (!strip || !chip || strip.offsetParent === null) return;
    const s = strip.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    const delta = c.left + c.width / 2 - (s.left + s.width / 2);
    if (Math.abs(delta) > 1) strip.scrollBy({ left: delta, behavior: "smooth" });
  }, [active]);

  const step = (dir: 1 | -1) => setActive((i) => (i + dir + count) % count);

  return (
    <section
      id="services"
      className="relative scroll-mt-24 overflow-hidden py-14 xl:py-[140px]"
    >
      <div className="mx-auto w-full max-w-[1520px] px-5 xl:px-25">
        <div className="flex flex-col items-start gap-6 xl:flex-row xl:items-stretch xl:gap-16">
          {/* Heading + list */}
          <div className="flex w-full flex-col items-start gap-6 xl:w-[480px] xl:shrink-0 xl:gap-10">
            <div className="flex flex-col items-start gap-3 xl:gap-4">
              <SectionLabel className="text-navy">{content.label}</SectionLabel>
              <h2 className="t-h2">
                {content.heading.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
            </div>

            {/* Phone: chip strip, bleeding to the viewport edges */}
            <ul
              ref={stripRef}
              data-lenis-prevent
              className="-mx-5 flex w-[calc(100%+40px)] list-none gap-2 overflow-x-auto overflow-y-hidden px-5 py-1 [-ms-overflow-style:none] [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden"
            >
              {content.items.map((service, i) => {
                const isActive = i === active;
                return (
                  <li key={service.title} className="shrink-0">
                    <button
                      ref={(el) => {
                        chipRefs.current[i] = el;
                      }}
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={isActive}
                      className={`flex h-10 cursor-pointer items-center whitespace-nowrap border px-4 font-[family-name:var(--font-heading)] text-[14px] font-bold leading-5 transition-colors duration-300 ${
                        isActive
                          ? "border-navy bg-navy text-white"
                          : "border-navy/20 bg-white text-navy"
                      }`}
                    >
                      {service.title}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: a numbered, ruled list */}
            <ul className="hidden w-full list-none flex-col p-0 xl:flex">
              {content.items.map((service, i) => {
                const isActive = i === active;
                return (
                  <li key={service.title} className="w-full border-b border-navy/10 last:border-0">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={isActive}
                      className="group flex w-full cursor-pointer items-center gap-5 py-4 text-start"
                    >
                      <span
                        className={`w-7 shrink-0 font-[family-name:var(--font-sans)] text-[12px] font-medium leading-5 tracking-[2px] transition-colors duration-300 ${
                          isActive ? "text-gold" : "text-muted group-hover:text-gold"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h4
                        className={`t-h4 flex-1 transition-colors duration-300 ${
                          isActive ? "text-navy" : "text-muted group-hover:text-navy"
                        }`}
                      >
                        {service.title}
                      </h4>
                      <ArrowUpRightIcon
                        className={`shrink-0 text-gold transition-[opacity,transform] duration-300 rtl:-scale-x-100 ${
                          isActive
                            ? "translate-x-0 opacity-100"
                            : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60 rtl:translate-x-1"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Photo panel + navy description card */}
          <div className="relative w-full xl:min-w-0 xl:flex-1">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface xl:aspect-auto xl:h-full xl:min-h-[600px]">
              {content.items.map((service, i) => (
                <Image
                  key={service.image}
                  src={service.image}
                  alt={i === active ? service.imageAlt : ""}
                  fill
                  sizes="(max-width: 1199px) 100vw, 900px"
                  priority={i === 0}
                  className={`object-cover transition-[opacity,transform] duration-700 ease-out ${
                    i === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
                  }`}
                />
              ))}
            </div>

            {/* In flow under the photo on phones; on the panel's corner from 1200px */}
            <div className="z-10 flex flex-col items-start gap-5 border-s-4 border-gold bg-navy p-6 xl:absolute xl:bottom-10 xl:start-10 xl:w-[440px] xl:gap-6 xl:px-9 xl:py-8">
              <div key={active} className="panel-in flex flex-col items-start gap-2 xl:gap-3">
                <p className="t-h5 text-white xl:text-[20px] xl:leading-7">{current.title}</p>
                <p className="t-body text-[#ccdce6]">{current.description}</p>
              </div>

              {/* Counter + wrap-around arrows */}
              <div className="flex w-full items-center justify-between">
                <p
                  dir="ltr"
                  className="font-[family-name:var(--font-sans)] text-[12px] font-medium leading-[18px] tracking-[2px] text-gold"
                >
                  {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={content.prev}
                    onClick={() => step(-1)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-200 hover:bg-white/10"
                  >
                    <CarouselArrowIcon direction={rtl ? "right" : "left"} />
                  </button>
                  <button
                    type="button"
                    aria-label={content.next}
                    onClick={() => step(1)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-200 hover:bg-white/10"
                  >
                    <CarouselArrowIcon direction={rtl ? "left" : "right"} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}
