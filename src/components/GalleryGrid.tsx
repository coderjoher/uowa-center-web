"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import Lightbox from "@/components/ui/Lightbox";
import { dirOf, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/**
 * The `/gallery` grid. Each tile is a button that opens the shared Lightbox
 * at its index; focus is handed back to that tile when it closes.
 */
export default function GalleryGrid({
  content,
  lang,
}: {
  content: SiteContent["pages"]["gallery"];
  lang: Locale;
}) {
  const { photos, lightbox } = content;
  const rtl = dirOf(lang) === "rtl";

  const [index, setIndex] = useState<number | null>(null);
  /** Focus is handed back to the tile that opened the overlay. */
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const step = useCallback(
    (delta: 1 | -1) =>
      setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  const close = useCallback(() => {
    setIndex(null);
    openerRef.current?.focus();
  }, []);

  return (
    <section className="mx-auto w-full max-w-[1520px] px-5 pb-14 xl:px-25 xl:pb-[140px]">
      <ul className="grid list-none grid-cols-2 gap-x-5 gap-y-8 p-0 xl:grid-cols-3 xl:gap-x-10 xl:gap-y-12">
        {photos.map((photo, i) => (
          <li key={photo.image} className="w-full">
            <Reveal scaleFrom={1} yFrom={30} className="w-full">
              <figure className="m-0 flex flex-col items-start">
                <button
                  type="button"
                  aria-label={`${lightbox.open}: ${photo.caption}`}
                  onClick={(event) => {
                    openerRef.current = event.currentTarget;
                    setIndex(i);
                  }}
                  className="group relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-surface"
                >
                  <Image
                    src={photo.image}
                    alt={photo.caption}
                    fill
                    sizes="(max-width: 1199px) 50vw, 420px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
                <div className="mt-4 h-px w-full bg-navy" />
                <figcaption className="t-body mt-3">{photo.caption}</figcaption>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>

      <Lightbox
        photos={photos}
        index={index}
        labels={lightbox}
        rtl={rtl}
        onClose={close}
        onStep={step}
      />
    </section>
  );
}
