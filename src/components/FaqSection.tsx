"use client";

import Image from "next/image";
import { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import { ArrowUpRightThinIcon } from "@/components/icons";
import type { SiteContent } from "@/types/content";

/**
 * Click accordion, index 1 open on load. A photo band is pinned to the top
 * 290px of the section (z 0); the 780x554 `#eef4f8` panel (padding 56)
 * overlaps it. Rows are separated by 1px navy rules and inset 24px from the
 * inline start of the panel.
 *
 * Below 1200px the photo band is dropped (the heading sat straight on it and
 * was unreadable) and the panel tightens: 20px inset, 16px questions, 15px
 * answers and 16px between rows, so the five questions fit in one screen.
 */
export default function FaqSection({
  content,
}: {
  content: SiteContent["faq"];
}) {
  const [open, setOpen] = useState<number[]>([1]);

  return (
    <section id="faq" className="relative scroll-mt-24 xl:pt-25">
      {/* Photo band */}
      <div className="absolute inset-x-0 top-0 -z-0 hidden h-[290px] xl:block">
        <Image
          src="/images/faq-banner.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1520px] flex-col items-start justify-between gap-8 overflow-hidden px-5 xl:flex-row xl:items-end xl:px-25">
        <div className="flex w-full flex-col items-start gap-4 xl:max-w-[325px] xl:pb-12">
          <SectionLabel className="text-navy">{content.label}</SectionLabel>
          <h2 className="t-h2">
            {content.heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        <div className="flex w-full flex-col items-start gap-4 bg-surface p-5 xl:w-[780px] xl:gap-6 xl:p-14">
          {content.items.map((faq, i) => {
            const isOpen = open.includes(i);
            return (
              <div key={faq.question} className="w-full">
                <div className="flex w-full flex-col items-start gap-2">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpen((prev) =>
                        prev.includes(i)
                          ? prev.filter((x) => x !== i)
                          : [...prev, i],
                      )
                    }
                    className="relative flex w-full items-center justify-between gap-3 ps-4 text-start xl:gap-4 xl:ps-6"
                  >
                    {/* 4px navy rule pinned to the inline start of the row */}
                    <span
                      aria-hidden
                      className={`absolute start-0 top-0 h-full w-1 transition-colors duration-300 ${
                        isOpen ? "bg-gold" : "bg-navy"
                      }`}
                    />
                    <h4 className="t-h4 text-[16px] leading-6 xl:w-[561px] xl:text-[24px] xl:leading-8">
                      {faq.question}
                    </h4>
                    {/* The wrapper carries the RTL mirror so the inline
                        rotation below is free to animate on its own. */}
                    <span className="flex shrink-0 rtl:-scale-x-100">
                      <ArrowUpRightThinIcon
                        className="text-navy transition-transform duration-300"
                        style={{ transform: isOpen ? undefined : "rotate(-90deg)" }}
                      />
                    </span>
                  </button>

                  {isOpen && faq.answer ? (
                    <div className="flex items-center ps-4 xl:ps-6">
                      <p className="t-body text-[15px] xl:w-[579px] xl:text-[16px]">{faq.answer}</p>
                    </div>
                  ) : null}
                </div>

                {i < content.items.length - 1 ? (
                  <div className="mt-4 h-px w-full bg-navy xl:mt-6" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
