import Image from "next/image";
import SolidButton from "@/components/ui/SolidButton";
import { AboutDashGrid } from "@/components/DashGrid";
import type { SiteContent } from "@/types/content";

/**
 * Two columns over a faint technical grid: heading, copy and CTA on the
 * inline-start side, a photo card on the inline-end side with the dash-grid
 * ornament tucked behind its outer corner. The card replaces the full-bleed
 * strip that used to sit under the section, so the hero is one composition
 * rather than a text block with a banner beneath it.
 */
export default function Hero({ content }: { content: SiteContent["hero"] }) {
  return (
    <header className="tech-grid relative overflow-hidden pt-25 xl:pt-[156px]">
      <div className="relative mx-auto flex w-full max-w-[1520px] flex-col gap-12 px-5 pb-20 xl:flex-row xl:items-center xl:justify-between xl:gap-16 xl:px-25 xl:pb-[120px]">
        {/* Copy */}
        <div className="flex w-full flex-col items-start gap-7 xl:max-w-[600px]">
          <h1 className="t-h1">{content.heading}</h1>
          <p className="t-body-lg xl:max-w-[480px]">{content.body}</p>
          <SolidButton href={content.ctaHref}>{content.cta}</SolidButton>
        </div>

        {/* Photo card */}
        <div className="relative w-full shrink-0 xl:w-[560px]">
          <AboutDashGrid className="pointer-events-none absolute -top-10 end-[-40px] hidden xl:block" />
          <div className="relative aspect-[4/3] w-full overflow-hidden xl:h-[440px]">
            <Image
              src="/images/hero-campus.jpg"
              alt={content.imageAlt}
              fill
              priority
              sizes="(max-width: 1199px) 100vw, 560px"
              className="object-cover"
            />
          </div>
          {/* Navy offset frame — the card's own shadow, in the house style. */}
          <span
            aria-hidden
            className="absolute -bottom-4 end-[-16px] -z-10 hidden h-full w-full bg-navy xl:block"
          />
        </div>
      </div>
    </header>
  );
}
