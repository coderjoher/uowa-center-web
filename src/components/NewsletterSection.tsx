"use client";

import type { SiteContent } from "@/types/content";

/**
 * 208px band on `#eef4f8`, inner padding 64px 100px, space-between.
 * Leading: h3 in the heading face, 30/40, letter-spacing .3px, max-width 280.
 * Trailing: a 735-wide form — 535x64 white input wrapper + a 180x64 navy
 * submit button, 20px gap.
 */
export default function NewsletterSection({
  content,
}: {
  content: SiteContent["newsletter"];
}) {
  return (
    <section className="overflow-hidden bg-surface">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col items-start justify-between gap-8 px-5 py-10 xl:flex-row xl:items-center xl:px-25 xl:py-16">
        <h3 className="max-w-[280px] font-[family-name:var(--font-heading)] text-[24px] font-normal leading-8 tracking-[0.3px] text-navy xl:text-[30px] xl:leading-10">
          {content.heading.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h3>

        <form
          className="flex w-full flex-col items-start gap-5 xl:w-[735px] xl:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="flex w-full flex-col items-start gap-2.5 xl:w-[535px]">
            <span className="sr-only">{content.label}</span>
            <span className="flex h-16 w-full items-center overflow-hidden bg-white px-6">
              <input
                type="email"
                name="email"
                required
                placeholder={content.placeholder}
                className="w-full border-0 bg-transparent font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy outline-none placeholder:text-muted"
              />
            </span>
          </label>

          <button
            type="submit"
            className="flex h-13 w-full shrink-0 items-center justify-center bg-navy px-10 py-2.5 font-[family-name:var(--font-heading)] text-[16px] font-bold leading-6 text-white transition-opacity duration-200 hover:opacity-90 xl:h-16 xl:w-[180px]"
          >
            {content.submit}
          </button>
        </form>
      </div>
    </section>
  );
}
