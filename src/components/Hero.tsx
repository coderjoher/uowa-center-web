import Image from "next/image";
import Link from "next/link";
import SolidButton from "@/components/ui/SolidButton";
import UnderlineLink from "@/components/ui/UnderlineLink";
import type { Service, SiteContent } from "@/types/content";

/**
 * Home-page hero in two rows.
 *
 * Row 1 — the composition. Copy on the inline-start side (eyebrow, heading,
 * intro, primary + secondary CTA). From 1200px the photo leaves the container:
 * it starts at 52% of the row, hangs from the underside of the navbar and
 * bleeds off the inline-end edge of the viewport, so the section reads as one
 * asymmetric spread rather than a text block next to a floating card. A navy
 * plaque on its bottom-start corner carries the caption in the house style.
 *
 * Row 2 — the areas of work. A hairline, then the first four service titles
 * as numbered links into the services page. It gives the hero a foothold in
 * what the centre actually does, and the rule under the photo ties the bleed
 * back to the grid.
 *
 * Below 1200px everything stacks on a tighter rhythm: copy, photo (16:10,
 * plaque still on its corner), then the areas as a 2×2 grid. The whole
 * section is meant to fit in roughly one phone screen.
 *
 * Every inline offset is logical, so the spread mirrors under `dir="rtl"`.
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
    <header className="tech-grid overflow-hidden">
      <div className="relative mx-auto w-full max-w-[1520px] px-5 pb-8 pt-22 xl:px-25 xl:pb-20 xl:pt-[156px]">
        {/* Row 1: copy + photo */}
        <div className="relative xl:flex xl:min-h-[540px] xl:items-center">
          <div className="hero-rise flex w-full flex-col items-start xl:w-1/2 xl:pe-12">
            <p className="t-label hero-eyebrow flex items-center gap-4 text-muted">
              <span aria-hidden className="hidden h-px w-10 shrink-0 bg-navy xl:block" />
              {content.label}
            </p>
            <h1 className="t-h1 mt-3 text-balance xl:mt-6">{content.heading}</h1>
            <p className="t-body-lg mt-4 max-w-[520px] text-pretty xl:mt-6">
              {content.body}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 xl:mt-9 xl:gap-x-8">
              <SolidButton href={content.ctaHref}>{content.cta}</SolidButton>
              <UnderlineLink href={content.secondaryCtaHref}>
                {content.secondaryCta}
              </UnderlineLink>
            </div>
          </div>

          {/* Photo. On desktop it is taken out of flow, pinned to the row's
              vertical extent, pulled up under the navbar (156 − 80 = 76px)
              and stretched to the viewport edge. The image is scaled up from
              its top edge so the photographer's mark along the bottom of the
              source is cropped away at every size. */}
          <figure className="hero-settle relative mt-8 aspect-[16/10] w-full overflow-hidden xl:absolute xl:-top-[76px] xl:bottom-0 xl:mt-0 xl:aspect-auto xl:w-auto xl:start-[52%] xl:end-[calc((100%-100vw)/2)]">
            <Image
              src="/images/service-network.jpg"
              alt={content.imageAlt}
              fill
              loading="eager"
              sizes="(max-width: 1199px) 100vw, 55vw"
              className="origin-top scale-[1.12] object-cover object-top"
            />
            <figcaption className="absolute bottom-0 start-0 flex max-w-[calc(100%-40px)] flex-col gap-0.5 bg-navy px-4 py-3 text-white xl:gap-1 xl:px-8 xl:py-6">
              <span className="font-[family-name:var(--font-sans)] text-[12px] leading-[18px] text-pale xl:text-[13px] xl:leading-5">
                {brand.university}
              </span>
              <span className="t-h5 text-[15px] text-white xl:text-[16px]">
                {content.imageCaption}
              </span>
            </figcaption>
          </figure>
        </div>

        {/* Row 2: areas of work */}
        <div className="relative mt-8 border-t border-navy pt-5 xl:mt-20 xl:flex xl:gap-16 xl:pt-10">
          <p className="t-label hero-eyebrow mb-4 shrink-0 text-muted xl:mb-0 xl:w-[220px] xl:pt-1">
            {content.areasLabel}
          </p>
          <ol className="grid w-full list-none grid-cols-2 gap-x-5 gap-y-5 p-0 xl:grid-cols-4 xl:gap-x-10 xl:gap-y-8">
            {areas.map((service, i) => (
              <li key={service.title}>
                <Link
                  href={`${content.ctaHref}#service-${i + 1}`}
                  className="group flex flex-col gap-1.5 xl:gap-3"
                >
                  <span className="font-[family-name:var(--font-sans)] text-[12px] leading-[18px] tracking-[2px] text-muted xl:text-[13px] xl:leading-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="t-h5 border-b border-transparent pb-1 text-[15px] text-navy transition-colors duration-200 group-hover:border-navy xl:text-[16px]">
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
