"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import { ServicesDashGrid } from "@/components/DashGrid";
import { CarouselArrowIcon } from "@/components/icons";
import { dirOf, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/**
 * Services slider. Selecting an item in the list — or a dot on the rail —
 * swaps the panel: the photos are stacked and cross-fade on opacity, while the
 * navy card's copy remounts on `key` and plays the `.panel-in` keyframe, so the
 * two halves stay in step without any timers.
 *
 * The list labels sit flush with the heading's edge: the marker occupies a
 * fixed 36px gutter that hangs outside that edge (negative inline-start
 * margin), and it scales in from zero rather than growing its width, so a
 * selection never shifts the label. The old 148px indent read as a
 * misalignment once the layout mirrored.
 *
 * The photo column is sized to its content: the description box overlaps the
 * photo's inline-start corner and the dot rail sits 20px off its inline-end
 * edge, instead of being pushed to the far side of a 630px column.
 *
 * Below 1200px the section becomes a phone slider: the six titles run as a
 * horizontal strip of chips under the heading (the active one scrolls into
 * view), the photo drops to 4:3, and the navy card sits under it carrying the
 * active title, its description, a counter and previous/next arrows that wrap
 * around. The desktop list and dot rail are hidden there.
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
        <div className="flex flex-col items-start justify-between gap-6 xl:h-[533px] xl:flex-row">
          {/* Heading + list */}
          <div className="flex w-full flex-col items-start justify-center gap-6 xl:h-[498px] xl:w-[490px] xl:gap-11">
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

            {/* Desktop: the vertical list */}
            <ul className="hidden w-full flex-col items-start gap-5 p-0 xl:-ms-9 xl:flex">
              {content.items.map((service, i) => {
                const isActive = i === active;
                return (
                  <li key={service.title} className="w-full">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={isActive}
                      className="group flex w-full cursor-pointer items-center gap-3 text-start"
                    >
                      <span
                        aria-hidden
                        className={`h-0.5 w-6 shrink-0 origin-[inline-start] bg-gold transition-transform duration-300 ease-out ${
                          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        }`}
                      />
                      <h4
                        className="t-h4 transition-colors duration-300"
                        style={{
                          color: isActive ? "var(--navy)" : "var(--muted)",
                        }}
                      >
                        {service.title}
                      </h4>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Photo + navy description card + dot rail */}
          <div className="relative w-full xl:me-15 xl:w-[408px] xl:shrink-0 xl:self-center">
            <div className="relative aspect-[4/3] w-full overflow-hidden xl:aspect-auto xl:h-[489px]">
              {content.items.map((service, i) => (
                <Image
                  key={service.image}
                  src={service.image}
                  alt={i === active ? service.imageAlt : ""}
                  fill
                  sizes="(max-width: 1199px) 100vw, 408px"
                  priority={i === 0}
                  className={`object-cover transition-opacity duration-500 ease-out ${
                    i === active ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>

            {/* In flow under the photo on phones; overlapping its corner from 1200px */}
            <div className="z-10 flex flex-col items-start gap-5 border-s-4 border-gold bg-navy p-6 xl:absolute xl:bottom-6 xl:start-[-40px] xl:w-[340px] xl:gap-0 xl:px-9 xl:py-8">
              <div key={active} className="panel-in flex flex-col items-start gap-2 xl:gap-0">
                <p className="t-h5 text-white xl:hidden">{current.title}</p>
                <p className="t-body text-white">{current.description}</p>
              </div>

              {/* Phone controls: counter + wrap-around arrows */}
              <div className="flex w-full items-center justify-between xl:hidden">
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

            {/* Dot rail — 20px off the photo's inline-end edge, centred on it */}
            <div className="hidden flex-col items-center gap-2 xl:absolute xl:end-[-60px] xl:top-1/2 xl:flex xl:-translate-y-1/2">
              {content.items.map((service, i) => (
                <button
                  key={service.title}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={service.title}
                  aria-current={i === active}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center"
                >
                  <span
                    aria-hidden
                    className={`flex items-center justify-center rounded-full border transition-all duration-300 ease-out ${
                      i === active
                        ? "h-10 w-10 border-gold"
                        : "h-2 w-2 border-transparent"
                    }`}
                  >
                    <span
                      className={`block h-2 w-2 shrink-0 rounded-full transition-colors duration-300 ${
                        i === active ? "bg-gold" : "bg-navy"
                      }`}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ServicesDashGrid className="pointer-events-none absolute start-0 top-[360px] hidden xl:block" />
    </section>
  );
}
