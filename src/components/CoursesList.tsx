import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import UnderlineLink from "@/components/ui/UnderlineLink";
import { CalendarIcon, PinIcon } from "@/components/icons";
import type { SiteContent } from "@/types/content";

/**
 * The `/courses` listing.
 *
 * `EventsSection` is a home-page teaser — a short heading column beside a
 * narrow list — so on a page whose hero already carries the title it repeated
 * the heading and left the heading column mostly empty. This is the same data
 * as equal-height cards on the full width, with the enquiry link pinned to the
 * bottom of each so the row of buttons lines up.
 */
export default function CoursesList({
  content,
}: {
  content: SiteContent["events"];
}) {
  return (
    <section className="mx-auto w-full max-w-[1520px] px-5 pb-20 xl:px-25 xl:pb-[140px]">
      <ul className="grid list-none grid-cols-1 gap-10 p-0 xl:grid-cols-3">
        {content.items.map((event) => (
          <li key={event.title} className="w-full">
            <Reveal scaleFrom={1} yFrom={30} className="h-full w-full">
              <article className="group flex h-full flex-col items-start">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    sizes="(max-width: 1199px) 100vw, 420px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="mt-5 h-px w-full bg-navy" />
                <h2 className="t-h4 mt-4">{event.title}</h2>

                <div className="mt-4 flex flex-col items-start gap-2">
                  <div className="flex items-center gap-[9px]">
                    <span className="flex w-5 shrink-0 justify-center">
                      <CalendarIcon className="text-navy" />
                    </span>
                    <p className="t-body">{event.date}</p>
                  </div>
                  <div className="flex items-center gap-[9px]">
                    <span className="flex w-5 shrink-0 justify-center">
                      <PinIcon className="text-navy" />
                    </span>
                    <p className="t-body">{event.venue}</p>
                  </div>
                </div>

                {/* mt-auto rather than a fixed gap, so the links stay in a
                    row even when one title wraps to another line. */}
                <div className="mt-auto pt-7">
                  <UnderlineLink href={event.href}>{content.link}</UnderlineLink>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
