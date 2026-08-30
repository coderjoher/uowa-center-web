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
 * The list marker animates its own width, which slides the label with it; a
 * hover on an inactive item previews the same marker.
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

            <ul className="flex w-full flex-col items-start gap-5 p-0 xl:ps-[148px]">
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
                        className={`h-0.5 shrink-0 bg-navy transition-all duration-300 ease-out ${
                          isActive ? "w-6" : "w-0 group-hover:w-6"
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
          <div className="relative flex w-full items-start justify-between xl:h-[533px] xl:max-w-[630px] xl:pb-11">
            <div className="relative h-[440px] w-full overflow-hidden xl:h-[489px] xl:w-[408px]">
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

            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-4 bg-navy p-[30px] xl:inset-x-auto xl:end-px xl:h-[224px] xl:w-[428px] xl:px-14 xl:py-12">
              <p key={active} className="panel-in t-body-lg text-white xl:w-[316px]">
                {current.description}
              </p>
            </div>

            {/* Dot rail */}
            <div className="hidden flex-col items-center gap-2 xl:flex">
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
