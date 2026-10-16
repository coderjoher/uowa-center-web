import Image from "next/image";
import SolidButton from "@/components/ui/SolidButton";
import UnderlineLink from "@/components/ui/UnderlineLink";
import CircuitPattern from "@/components/ui/CircuitPattern";
import type { Service, SiteContent } from "@/types/content";
import RichText from "@/components/ui/RichText";

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
 * Row 2 — the figures, as a navy strip joined to the band: each a gold
 * number over what it counts, 2-up on phones. Editors set them in the admin
 * (الواجهة الرئيسية → الإحصاءات).
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
  /* Older content has no figures yet: the first four services stand in. */
  const stats = (content.stats ?? services.slice(0, 4).map((service, i) => ({ value: String(i + 1).padStart(2, "0"), label: service.title }))).filter(
    (stat) => stat.value || stat.label,
  );

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
            src={content.image || "/images/service-network.jpg"}
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
            <RichText value={content.body} className="t-body-lg mt-4 max-w-[540px] text-pretty text-[#ccdce6] xl:mt-6" />
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

        {/* Shown only while the photo has a caption: clearing «تعليق الصورة»
            in the admin removes the box. */}
        {content.imageCaption ? (
          <p className="absolute bottom-0 end-0 hidden flex-col gap-1 border-s-[3px] border-gold bg-navy/90 px-7 py-5 text-white backdrop-blur-sm xl:flex">
            <span className="font-[family-name:var(--font-sans)] text-[13px] leading-5 text-pale">
              {brand.university}
            </span>
            <span className="t-h5 text-white">{content.imageCaption}</span>
          </p>
        ) : null}
      </div>

      {/* Row 2: the figures, edited in the admin as «الإحصاءات» */}
      {stats.length ? (
        <div className="border-t border-white/10">
          <div className="mx-auto w-full max-w-[1520px] px-5 py-7 xl:flex xl:items-center xl:gap-16 xl:px-25 xl:py-10">
            {content.areasLabel ? (
              <p className="t-label hero-eyebrow mb-5 shrink-0 text-pale xl:mb-0 xl:w-[200px]">
                {content.areasLabel}
              </p>
            ) : null}
            <dl className="grid w-full grid-cols-2 gap-x-5 gap-y-6 xl:grid-cols-4 xl:gap-x-10">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col gap-1 border-s-2 border-gold/60 ps-4">
                  <dt className="order-2 text-[14px] leading-6 text-white/85 xl:text-[16px]">{stat.label}</dt>
                  <dd className="order-1 font-[family-name:var(--font-heading)] text-[26px] font-semibold leading-tight text-gold xl:text-[34px]">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </header>
  );
}
