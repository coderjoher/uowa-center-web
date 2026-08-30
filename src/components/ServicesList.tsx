import Image from "next/image";
import type { SiteContent } from "@/types/content";

/**
 * The full services listing used on `/services` — one row per service with an
 * anchor id the site map links to. Rows alternate which side the photo sits on;
 * `flex-row-reverse` is direction-aware, so the rhythm mirrors under RTL.
 */
export default function ServicesList({
  content,
}: {
  content: SiteContent["services"];
}) {
  return (
    <section className="mx-auto flex w-full max-w-[1520px] flex-col gap-16 px-5 pb-20 xl:gap-25 xl:px-25 xl:pb-[140px]">
      {content.items.map((service, i) => (
        <article
          key={service.title}
          id={`service-${i + 1}`}
          className={`flex scroll-mt-28 flex-col gap-6 xl:items-center xl:gap-16 ${
            i % 2 === 0 ? "xl:flex-row" : "xl:flex-row-reverse"
          }`}
        >
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden xl:aspect-auto xl:h-[360px] xl:w-[520px]">
            <Image
              src={service.image}
              alt={service.imageAlt}
              fill
              sizes="(max-width: 1199px) 100vw, 520px"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col items-start gap-4 xl:max-w-[560px]">
            <span
              aria-hidden
              className="font-[family-name:var(--font-heading)] text-[14px] font-bold leading-none text-muted"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="t-h4">{service.title}</h2>
            <div className="h-px w-16 bg-navy" />
            <p className="t-body-lg">{service.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
