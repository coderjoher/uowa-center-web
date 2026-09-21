import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import SolidButton from "@/components/ui/SolidButton";
import Reveal from "@/components/ui/Reveal";
import type { SiteContent } from "@/types/content";

/**
 * Home-page gallery teaser: a four-tile photo mosaic with nothing written on
 * it — one tall tile spanning two rows, three landscape tiles beside it — and
 * a narrow column holding only the label, the heading and the link to the
 * full gallery. The paragraph and the per-photo titles were cut on purpose;
 * the photos carry the section.
 */
export default function GallerySection({
  content,
}: {
  content: SiteContent["gallery"];
}) {
  const [tall, ...wide] = content.items;

  return (
    <section
      id="gallery"
      className="relative mx-auto flex w-full max-w-[1520px] scroll-mt-24 flex-col gap-8 px-5 py-14 xl:flex-row xl:items-end xl:justify-between xl:px-25 xl:py-[140px]"
    >
      {/* Heading column */}
      <div className="flex w-full flex-col items-start gap-8 xl:max-w-[372px] xl:pb-2">
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
        <SolidButton href={content.ctaHref}>{content.cta}</SolidButton>
      </div>

      {/* Mosaic */}
      <Reveal className="w-full xl:w-[796px]">
        <div className="grid grid-cols-2 grid-rows-[200px_200px] gap-4 xl:grid-cols-3 xl:grid-rows-[260px_260px] xl:gap-5">
          <div className="relative row-span-2 overflow-hidden">
            <Image
              src={tall.image}
              alt={tall.title}
              fill
              sizes="(max-width: 1199px) 50vw, 260px"
              className="object-cover"
            />
          </div>
          {wide.map((tile, i) => (
            <div
              key={tile.image}
              className={`relative overflow-hidden ${i === 2 ? "hidden xl:block" : ""} ${
                i === 0 ? "xl:col-span-2" : ""
              }`}
            >
              <Image
                src={tile.image}
                alt={tile.title}
                fill
                sizes="(max-width: 1199px) 50vw, 520px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
