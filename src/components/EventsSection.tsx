import Image from "next/image";
import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import UnderlineLink from "@/components/ui/UnderlineLink";
import Reveal from "@/components/ui/Reveal";
import PhoneSlider from "@/components/ui/PhoneSlider";
import { CalendarIcon, PinIcon } from "@/components/icons";
import type { SiteContent } from "@/types/content";

/** How many courses the home page shows; the rest are on `/courses`. */
const HOME_COUNT = 3;

/**
 * Upcoming courses on the home page. The label and heading open the section
 * with the link to every course at the end of the row; under them the next
 * three courses stand side by side as equal cards: a 16:10 photo, the title,
 * the date and venue, and the link to the course pinned to the card's foot so
 * the three line up whatever the length of their titles.
 *
 * Below 1200px the cards become a swipeable slider (see PhoneSlider), each
 * 80% of the viewport wide and centred.
 */
export default function EventsSection({
  content,
}: {
  content: SiteContent["events"];
}) {
  const heading = content.heading.filter(Boolean);

  return (
    <section
      id="courses"
      className="mx-auto flex w-full max-w-[1520px] scroll-mt-24 flex-col items-start gap-8 px-5 py-14 xl:gap-12 xl:px-25 xl:py-[112px]"
    >
      <div className="flex w-full flex-col items-start justify-between gap-6 xl:flex-row xl:items-end">
        <div className="flex flex-col items-start gap-4 xl:max-w-[560px]">
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
        </div>
        {content.allLink && content.allHref ? (
          <div className="pb-2.5">
            <UnderlineLink href={content.allHref}>{content.allLink}</UnderlineLink>
          </div>
        ) : null}
      </div>

      <PhoneSlider prev={content.prev} next={content.next} className="xl:grid xl:grid-cols-3 xl:items-stretch xl:gap-10">
        {content.items.slice(0, HOME_COUNT).map((event) => (
          <li key={event.slug} className="w-[80vw] shrink-0 snap-center xl:w-auto">
            <Reveal scaleFrom={1} yFrom={40} className="h-full w-full">
              <article className="group flex h-full flex-col border border-border-soft bg-white transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(21,40,61,0.45)]">
                <Link href={event.href} tabIndex={-1} aria-hidden className="relative block aspect-[16/10] w-full overflow-hidden bg-surface">
                  <Image
                    src={event.image}
                    alt=""
                    fill
                    sizes="(max-width: 1199px) 80vw, 440px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>

                <div className="flex flex-1 flex-col items-start gap-3 p-5 xl:p-7">
                  <h3 className="t-h4 text-[18px] leading-7 xl:text-[21px] xl:leading-8">
                    <Link href={event.href}>{event.title}</Link>
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <p className="t-body flex items-center gap-2.5 text-[14px] leading-6 xl:text-[15px]">
                      <span className="flex w-5 shrink-0 justify-center">
                        <CalendarIcon className="text-gold" />
                      </span>
                      {event.date}
                    </p>
                    <p className="t-body flex items-center gap-2.5 text-[14px] leading-6 xl:text-[15px]">
                      <span className="flex w-5 shrink-0 justify-center">
                        <PinIcon className="text-gold" />
                      </span>
                      {event.venue}
                    </p>
                  </div>
                  <div className="mt-auto pt-3">
                    <UnderlineLink href={event.href}>{content.link}</UnderlineLink>
                  </div>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </PhoneSlider>
    </section>
  );
}
