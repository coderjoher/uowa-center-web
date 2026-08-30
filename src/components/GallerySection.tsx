import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import SolidButton from "@/components/ui/SolidButton";
import Reveal from "@/components/ui/Reveal";
import type { SiteContent } from "@/types/content";

/**
 * A `#eef4f8` band (1097x320) is pinned to the top of the section behind the
 * content. Two 388x550 cards (gap 20) enter from scale(.9) translateY(55).
 * A 96x96 pale "plus" ornament sits near the trailing edge.
 */
export default function GallerySection({
  content,
}: {
  content: SiteContent["gallery"];
}) {
  return (
    <section
      id="gallery"
      className="relative mx-auto flex w-full max-w-[1520px] scroll-mt-24 flex-col px-5 pb-0 pt-10 xl:flex-row xl:items-start xl:justify-between xl:px-25 xl:pt-20"
    >
      {/* Tinted band */}
      <div
        aria-hidden
        className="absolute start-[328px] top-0 -z-0 hidden h-80 w-[1097px] bg-surface xl:block"
      />

      <div className="relative z-10 order-2 flex w-full flex-col items-start gap-5 xl:order-1 xl:w-[796px] xl:flex-row">
        {content.items.map((card) => (
          <Reveal key={card.title} className="w-full xl:w-[388px]">
            <div className="flex flex-col items-start gap-6">
              <h4 className="t-h4">{card.title}</h4>
              <div className="relative h-[300px] w-full xl:aspect-[388/494] xl:h-auto">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 1199px) 100vw, 388px"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="relative z-10 order-1 mb-10 flex w-full flex-col items-start gap-9 xl:order-2 xl:mb-0 xl:h-[560px] xl:max-w-[372px] xl:justify-between xl:gap-[218px]">
        <div className="flex flex-col items-start gap-4">
          <SectionLabel className="text-navy">{content.label}</SectionLabel>
          <h2 className="t-h2">
            {content.heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        <div className="flex flex-col items-start gap-8">
          <p className="t-body">{content.body}</p>
<SolidButton href={content.ctaHref}>{content.cta}</SolidButton>
        </div>
      </div>

      {/* 96x96 pale "plus" ornament */}
      <div
        aria-hidden
        className="pointer-events-none absolute start-[1301px] top-[358px] z-10 hidden h-24 w-24 xl:block"
      >
        <span className="absolute start-0 top-[47px] h-0.5 w-[42px] bg-pale" />
        <span className="absolute start-[54px] top-[47px] h-0.5 w-[42px] bg-pale" />
        <span className="absolute start-[47px] top-0 h-[42px] w-0.5 bg-pale" />
        <span className="absolute start-[47px] top-[54px] h-[42px] w-0.5 bg-pale" />
      </div>
    </section>
  );
}
