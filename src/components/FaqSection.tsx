"use client";

import Image from "next/image";
import { useId, useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SiteContent } from "@/types/content";
import RichText from "@/components/ui/RichText";

/**
 * Questions and answers in two balanced columns. The start column holds the
 * label and heading and, from 1200px, the section's photo beneath them
 * (sticky, so it stays beside a long list). The other column is the
 * accordion: numbered rows separated by hairlines, a plus that turns into a
 * minus, and the open row marked by a gold rule along its inline start. The
 * first question is open on load; any number can be open at once.
 *
 * Below 1200px the columns stack and the photo is left out, so the questions
 * follow the heading straight away.
 */
export default function FaqSection({
  content,
}: {
  content: SiteContent["faq"];
}) {
  const [open, setOpen] = useState<number[]>([0]);
  const id = useId();
  const heading = content.heading.filter(Boolean);
  const toggle = (i: number) => setOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <section id="faq" className="bg-surface/60 scroll-mt-24">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-8 px-5 py-14 xl:flex-row xl:items-start xl:justify-between xl:gap-20 xl:px-25 xl:py-[112px]">
        <div className="flex w-full flex-col items-start gap-4 xl:sticky xl:top-28 xl:w-[440px] xl:shrink-0">
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
          <div className="relative mt-6 hidden aspect-[4/3] w-full overflow-hidden xl:block">
            <Image src={content.image || "/images/faq-banner.jpg"} alt="" fill sizes="440px" className="object-cover" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gold" />
          </div>
        </div>

        <ul className="flex w-full list-none flex-col border-t border-navy/15 p-0 xl:max-w-[760px]">
          {content.items.map((faq, i) => {
            const isOpen = open.includes(i);
            const panel = `${id}-answer-${i}`;
            return (
              <li key={`${faq.question}-${i}`} className="relative border-b border-navy/15 bg-white">
                <span
                  aria-hidden
                  className={`absolute inset-y-0 start-0 w-1 transition-colors duration-300 ${isOpen ? "bg-gold" : "bg-transparent"}`}
                />
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panel}
                    onClick={() => toggle(i)}
                    className="flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-start xl:gap-6 xl:px-8 xl:py-6"
                  >
                    <span className="w-7 shrink-0 font-[family-name:var(--font-sans)] text-[14px] font-semibold text-gold xl:text-[15px]" dir="ltr">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-[family-name:var(--font-heading)] text-[16px] font-semibold leading-7 text-navy xl:text-[19px] xl:leading-8">
                      {faq.question}
                    </span>
                    <span
                      aria-hidden
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                        isOpen ? "border-navy bg-navy text-white" : "border-navy/30 text-navy"
                      }`}
                    >
                      <span className="absolute h-0.5 w-3.5 bg-current" />
                      <span className={`absolute h-3.5 w-0.5 bg-current transition-transform duration-300 ${isOpen ? "scale-y-0" : ""}`} />
                    </span>
                  </button>
                </h3>
                {isOpen && faq.answer ? (
                  <div id={panel} className="pb-6 pe-5 ps-16 xl:pb-7 xl:pe-8 xl:ps-[88px]">
                    <RichText value={faq.answer} className="t-body text-[15px] leading-8 xl:text-[16px]" />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
