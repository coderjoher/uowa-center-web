import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import UnderlineLink from "@/components/ui/UnderlineLink";
import Reveal from "@/components/ui/Reveal";
import { CalendarIcon, PinIcon } from "@/components/icons";
import type { SiteContent } from "@/types/content";

/**
 * Heading column 372 wide; list column 735 wide. The rows are a ruled list:
 * a 1px navy hairline between neighbours and the same 32px of padding either
 * side of it, with the first row flush to the top. The text block is centred
 * against the 132px thumbnail, so a two-line title and a one-line title give
 * rows of the same height and the rhythm stays even. Rows enter from
 * translateY(45).
 */
export default function EventsSection({
  content,
}: {
  content: SiteContent["events"];
}) {
  return (
    <section
      id="courses"
      className="relative mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 py-14 xl:flex xl:items-start xl:justify-between xl:px-25 xl:py-[140px]"
    >
      <div className="flex max-w-[372px] flex-col items-start gap-4">
        <SectionLabel className="text-navy">{content.label}</SectionLabel>
        <h2 className="t-h2">
          {content.heading.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
      </div>

      <div className="mt-8 flex w-full flex-col items-start divide-y divide-navy/20 xl:mt-0 xl:w-[735px]">
        {content.items.map((event) => (
          <Reveal key={event.title} scaleFrom={1} yFrom={45} className="w-full py-8 first:pt-0 last:pb-0">
            <div className="flex flex-col items-start gap-5 xl:flex-row xl:items-center xl:gap-6">
              <div className="relative h-[200px] w-full shrink-0 xl:h-33 xl:w-[190px]">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  sizes="(max-width: 1199px) 100vw, 190px"
                  className="object-cover"
                />
              </div>

              <div className="flex w-full flex-col items-start justify-between gap-2.5 xl:w-[490px] xl:flex-row xl:items-center xl:gap-6">
                <div className="flex flex-col items-start xl:w-[342px]">
                  <h4 className="t-h4">{event.title}</h4>
                  <div className="mt-3 flex items-center gap-[9px]">
                    <span className="flex w-5 shrink-0 justify-center">
                      <CalendarIcon className="text-navy" />
                    </span>
                    <p className="t-body">{event.date}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-[9px]">
                    <span className="flex w-5 shrink-0 justify-center">
                      <PinIcon className="text-navy" />
                    </span>
                    <p className="t-body">{event.venue}</p>
                  </div>
                </div>

                <UnderlineLink href={event.href}>{content.link}</UnderlineLink>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div
        aria-hidden
        className="ornament-flip pointer-events-none absolute start-0 top-[412px] z-10 hidden h-[396px] w-[490px] bg-[url('/svg/ornament-events.svg')] xl:block"
      />
    </section>
  );
}
