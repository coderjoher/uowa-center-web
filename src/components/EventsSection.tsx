import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import UnderlineLink from "@/components/ui/UnderlineLink";
import Reveal from "@/components/ui/Reveal";
import { CalendarIcon, PinIcon } from "@/components/icons";
import type { SiteContent } from "@/types/content";

/**
 * Heading column 372 wide; list column 735 wide with three row wrappers
 * (gap 40) each carrying 40px of top padding. Row: 190px thumbnail + a 490px
 * detail block whose text column is 342 wide and whose link is bottom-aligned.
 * Rows enter from translateY(45).
 */
export default function EventsSection({
  content,
}: {
  content: SiteContent["events"];
}) {
  return (
    <section
      id="courses"
      className="relative mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 py-20 xl:flex xl:items-start xl:justify-between xl:px-25 xl:py-[140px]"
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

      <div className="mt-10 flex w-full flex-col items-start gap-10 xl:mt-0 xl:w-[735px]">
        {content.items.map((event) => (
          <Reveal key={event.title} scaleFrom={1} yFrom={45} className="w-full">
            <div className="flex flex-col items-start justify-between gap-5 pt-10 xl:flex-row xl:gap-6">
              <div className="relative h-[200px] w-full shrink-0 xl:h-33 xl:w-[190px] xl:self-stretch">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  sizes="(max-width: 1199px) 100vw, 190px"
                  className="object-cover"
                />
              </div>

              <div className="flex w-full flex-col items-start justify-between gap-2.5 xl:w-[490px] xl:flex-row xl:items-end xl:gap-6">
                <div className="flex flex-col items-start xl:w-[342px]">
                  <h4 className="t-h4">{event.title}</h4>
                  <div className="mt-5 flex items-center gap-[9px] xl:mt-10">
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
