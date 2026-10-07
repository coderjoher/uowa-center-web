import Image from "next/image";
import Link from "next/link";
import SolidButton from "@/components/ui/SolidButton";
import UnderlineLink from "@/components/ui/UnderlineLink";
import CircuitPattern from "@/components/ui/CircuitPattern";
import type { Service, SiteContent } from "@/types/content";

/**
 * Home-page hero, in the university's own idiom (compare the student-life
 * page on uowa.edu.iq): the photo runs full-bleed under a navy gradient that
 * deepens toward the copy, so white type sits on it with full contrast.
 *
 * Row 1 — the photo band. Copy on the inline-start side: a gold rule and the
 * eyebrow, the heading in white, the intro, then a gold primary button and a
 * white underline link. The circuit ornament runs across the gradient with
 * its pulses moving, and the photo's caption plaque keeps the bottom-end
 * corner. Below 1200px the gradient turns to rise from the bottom and the
 * copy sits at the foot of the photo.
 *
 * Row 2 — the areas of work, as a navy strip joined to the band: four
 * numbered links (gold numerals) into the services page, 2×2 on phones.
 *
 * The copy keeps the `.hero-rise` stagger and the photo `.hero-settle`; both
 * are held while the first-visit intro is up. Every offset is logical, so the
 * spread mirrors under `dir="rtl"`.
 */
export default function Hero({
  content,
  brand,
  services,
}: {
  content: SiteContent["hero"];
  brand: SiteContent["brand"];
  services: Service[];
}) {
  const areas = services.slice(0, 4);

  return (
    <header className="bg-navy pt-[68px] xl:pt-20">
      {/* Row 1: photo band */}
      <div className="relative isolate flex min-h-[560px] items-end overflow-hidden xl:min-h-[620px] xl:items-center">
        {/* The student sits on the photo's right; on RTL pages the copy takes
            that side, so the photo is mirrored to keep him in view. The
            scale crops the watermark along the bottom, so nothing legible
            is reversed. */}
        <div className="hero-settle absolute inset-0 -z-20 rtl:-scale-x-100">
          <Image
            src="/images/service-network.jpg"
            alt={content.imageAlt}
            fill
            loading="eager"
            sizes="100vw"
            className="origin-top scale-[1.12] object-cover object-[center_30%]"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-navy via-navy/85 to-navy/25 xl:bg-linear-to-r xl:from-navy xl:via-navy/80 xl:to-navy/0 xl:rtl:bg-linear-to-l" />
        <CircuitPattern className="absolute inset-y-0 start-0 -z-10 hidden h-full w-[62%] opacity-80 xl:block" />

        <div className="relative mx-auto w-full max-w-[1520px] px-5 pb-10 pt-40 xl:px-25 xl:py-24">
          <div className="hero-rise flex max-w-[640px] flex-col items-start">
            <p className="t-label hero-eyebrow flex items-center gap-4 text-pale">
              <span aria-hidden className="h-0.5 w-10 shrink-0 bg-gold" />
              {content.label}
            </p>
            <h1 className="t-h1 mt-4 text-balance text-white xl:mt-6">{content.heading}</h1>
            <p className="t-body-lg mt-4 max-w-[540px] text-pretty text-[#ccdce6] xl:mt-6">
              {content.body}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4 xl:mt-10">
              <SolidButton href={content.ctaHref} variant="gold">
                {content.cta}
              </SolidButton>
              <UnderlineLink href={content.secondaryCtaHref} tone="white">
                {content.secondaryCta}
              </UnderlineLink>
            </div>
          </div>
        </div>

        <p className="absolute bottom-0 end-0 hidden flex-col gap-1 border-s-[3px] border-gold bg-navy/90 px-7 py-5 text-white backdrop-blur-sm xl:flex">
          <span className="font-[family-name:var(--font-sans)] text-[13px] leading-5 text-pale">
            {brand.university}
          </span>
          <span className="t-h5 text-white">{content.imageCaption}</span>
        </p>
      </div>

      {/* Row 2: areas of work */}
      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-[1520px] px-5 py-7 xl:flex xl:items-center xl:gap-16 xl:px-25 xl:py-10">
          <p className="t-label hero-eyebrow mb-5 shrink-0 text-pale xl:mb-0 xl:w-[200px]">
            {content.areasLabel}
          </p>
          <ol className="grid w-full list-none grid-cols-2 gap-x-5 gap-y-6 p-0 xl:grid-cols-4 xl:gap-x-10">
            {areas.map((service, i) => (
              <li key={service.title}>
                <Link href={`${content.ctaHref}#service-${i + 1}`} className="group flex flex-col gap-1.5 xl:gap-2">
                  <span className="font-[family-name:var(--font-sans)] text-[12px] font-medium leading-[18px] tracking-[2px] text-gold xl:text-[13px] xl:leading-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="t-h5 border-b border-transparent pb-1 text-[15px] text-white transition-colors duration-200 group-hover:border-gold xl:text-[17px]">
                    {service.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </header>
  );
}
