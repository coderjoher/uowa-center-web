"use client";

import Image from "next/image";
import { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import { ServicesDashGrid } from "@/components/DashGrid";
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
 */
export default function ServicesSection({
  content,
}: {
  content: SiteContent["services"];
}) {
  const [active, setActive] = useState(0);
  const current = content.items[active];

  return (
    <section
      id="services"
      className="relative scroll-mt-24 overflow-hidden py-20 xl:py-[140px]"
    >
      <div className="mx-auto w-full max-w-[1520px] px-5 xl:px-25">
        <div className="flex flex-col items-start justify-between gap-[30px] xl:h-[533px] xl:flex-row">
          {/* Heading + list */}
          <div className="flex w-full flex-col items-start justify-center gap-11 xl:h-[498px] xl:w-[490px]">
            <div className="flex flex-col items-start gap-4">
              <SectionLabel className="text-navy">{content.label}</SectionLabel>
              <h2 className="t-h2">
                {content.heading.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
            </div>

            <ul className="flex w-full flex-col items-start gap-5 p-0 xl:-ms-9">
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
                        className={`h-0.5 w-6 shrink-0 origin-[inline-start] bg-navy transition-transform duration-300 ease-out ${
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
            <div className="relative h-[440px] w-full overflow-hidden xl:h-[489px]">
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

            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start bg-navy p-[30px] xl:inset-x-auto xl:bottom-6 xl:start-[-40px] xl:w-[340px] xl:px-9 xl:py-8">
              <p key={active} className="panel-in t-body text-white">
                {current.description}
              </p>
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
                        ? "h-10 w-10 border-navy"
                        : "h-2 w-2 border-transparent"
                    }`}
                  >
                    <span className="block h-2 w-2 shrink-0 rounded-full bg-navy" />
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
