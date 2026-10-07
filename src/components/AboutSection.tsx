import Image from "next/image";
import UnderlineLink from "@/components/ui/UnderlineLink";
import SectionLabel from "@/components/ui/SectionLabel";
import CircuitPattern from "@/components/ui/CircuitPattern";
import type { SiteContent } from "@/types/content";

/**
 * Desktop: 936px tall. The composition block (828x656) holds three absolutely
 * positioned children — the building photo (406x508), the campus photo
 * (315x340) and the navy caption card (613 wide, 274 minimum). Every offset is
 * an inline-start value so the whole composition mirrors under RTL.
 *
 * The card's text is start-aligned, not end-aligned: the source layout hugged
 * the text against the photo edge, which under RTL became left-aligned Arabic.
 * Its height is a minimum rather than fixed, and the heading steps down to
 * 36px inside it — at 44px the Arabic ran to four lines and 64px past the
 * bottom of the card.
 */
export default function AboutSection({
  content,
}: {
  content: SiteContent["about"];
}) {
  return (
    <section
      id="about"
      className="relative mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 py-14 xl:flex xl:items-end xl:justify-between xl:px-25 xl:py-[140px]"
    >
      {/* Left composition */}
      <div className="relative w-full max-w-[828px] xl:h-[656px]">
        {/* Navy caption card */}
        <div className="relative z-20 flex flex-col items-start gap-2 border-s-4 border-gold bg-navy p-6 xl:absolute xl:start-0 xl:top-0 xl:min-h-[274px] xl:w-[613px] xl:justify-center xl:gap-3 xl:px-14 xl:py-12">
          <SectionLabel className="text-white">{content.label}</SectionLabel>
          <h2 className="t-h2 text-white xl:text-[36px] xl:leading-[54px]">
            {content.heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        {/* Building photo */}
        <div className="relative mt-5 h-[200px] w-full xl:absolute xl:start-[420px] xl:top-24 xl:mt-0 xl:h-[508px] xl:w-[406px]">
          <Image
            src="/images/about-building.jpg"
            alt={content.buildingAlt}
            fill
            sizes="(max-width: 1199px) 100vw, 406px"
            className="object-cover"
          />
        </div>

        {/* Overlapping campus photo */}
        <div className="relative mt-5 h-[200px] w-full xl:absolute xl:start-[85px] xl:top-[316px] xl:mt-0 xl:h-[340px] xl:w-[315px]">
          <Image
            src="/images/about-walkway.jpg"
            alt={content.walkwayAlt}
            fill
            sizes="(max-width: 1199px) 100vw, 315px"
            className="object-cover"
          />
        </div>
      </div>

      {/* Right column */}
      <div className="mt-6 flex w-full flex-col items-start gap-9 xl:mt-0 xl:max-w-[367px] xl:pb-13">
        <p className="t-body-lg">{content.body}</p>
        <UnderlineLink href={content.linkHref}>{content.link}</UnderlineLink>
      </div>

      {/* Circuit ornament along the inline-end edge */}
      <CircuitPattern tone="dark" className="absolute end-0 top-[120px] -z-0 hidden h-[300px] w-[420px] xl:block" />
    </section>
  );
}
