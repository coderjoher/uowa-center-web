import Image from "next/image";
import type { SiteContent } from "@/types/content";

/**
 * The full services listing on `/services`, laid out like the university's
 * own student-life page (uowa.edu.iq/arabic/student-life): one bordered,
 * lightly rounded card per service, half photo and half text, 300px tall on
 * desktop, with the photo swapping sides from card to card and 24px between
 * them. On phones each card stacks, photo on top at 16:9.
 *
 * Every card keeps the anchor id (`#service-n`) the hero and the site map
 * link to. `flex-row-reverse` is direction-aware, so the alternation mirrors
 * under RTL.
 */
export default function ServicesList({
  content,
}: {
  content: SiteContent["services"];
}) {
  return (
    <section className="mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-5 pb-14 xl:gap-6 xl:px-25 xl:pb-[120px]">
      {content.items.map((service, i) => (
        <article
          key={service.title}
          id={`service-${i + 1}`}
          className={`group flex scroll-mt-28 flex-col overflow-hidden rounded-md border border-border-soft bg-white transition-shadow duration-300 hover:shadow-[0_12px_32px_-18px_rgb(21_40_61/0.35)] xl:h-[300px] ${
            i % 2 === 0 ? "xl:flex-row" : "xl:flex-row-reverse"
          }`}
        >
          <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden xl:aspect-auto xl:h-full xl:w-1/2">
            <Image
              src={service.image}
              alt={service.imageAlt}
              fill
              sizes="(max-width: 1199px) 100vw, 660px"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
          </div>

          <div className="flex flex-1 flex-col items-start justify-center gap-3 p-6 xl:px-12">
            <span
              aria-hidden
              className="font-[family-name:var(--font-sans)] text-[13px] font-medium leading-none tracking-[2px] text-gold"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="t-h4">{service.title}</h2>
            <span aria-hidden className="h-0.5 w-10 bg-gold" />
            <p className="t-body max-w-[520px]">{service.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
