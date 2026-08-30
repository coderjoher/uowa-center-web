import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import type { GalleryPhoto } from "@/types/content";

/** The `/gallery` grid: 4:3 photos with a caption beneath a hairline rule. */
export default function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  return (
    <section className="mx-auto w-full max-w-[1520px] px-5 pb-20 xl:px-25 xl:pb-[140px]">
      <ul className="grid list-none grid-cols-2 gap-x-5 gap-y-8 p-0 xl:grid-cols-3 xl:gap-x-10 xl:gap-y-12">
        {photos.map((photo) => (
          <li key={photo.image} className="w-full">
            <Reveal scaleFrom={1} yFrom={30} className="w-full">
              <figure className="m-0 flex flex-col items-start">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                  <Image
                    src={photo.image}
                    alt={photo.caption}
                    fill
                    sizes="(max-width: 1199px) 50vw, 420px"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="mt-4 h-px w-full bg-navy" />
                <figcaption className="t-body mt-3">{photo.caption}</figcaption>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
