"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import Lightbox, { type LightboxLabels, type LightboxPhoto } from "@/components/ui/Lightbox";

/**
 * A grid of any number of photos, each a button into the shared Lightbox;
 * focus goes back to the photo that opened it. Used by the `/gallery` page,
 * the photo galleries under news stories and courses, and the gallery block.
 *
 * Every photo is the same 4:3 tile, so a gallery of any length stays even:
 * two across on phones, three from 1200px (four for the compact galleries
 * under an article). A caption, when there is one, sits under its photo.
 */
export default function PhotoGallery({
  photos,
  labels,
  rtl,
  compact = false,
}: {
  photos: LightboxPhoto[];
  labels: LightboxLabels;
  rtl: boolean;
  /** Smaller tiles and no captions: for the photos under an article. */
  compact?: boolean;
}) {
  const shown = photos.filter((photo) => photo.image);
  const [index, setIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const step = useCallback(
    (delta: 1 | -1) => setIndex((i) => (i === null ? i : (i + delta + shown.length) % shown.length)),
    [shown.length],
  );
  const close = useCallback(() => {
    setIndex(null);
    openerRef.current?.focus();
  }, []);

  if (!shown.length) return null;

  return (
    <>
      <ul
        className={`grid list-none grid-cols-2 p-0 ${
          compact ? "gap-3 sm:grid-cols-3 xl:grid-cols-4 xl:gap-4" : "gap-x-4 gap-y-6 xl:grid-cols-3 xl:gap-x-8 xl:gap-y-10"
        }`}
      >
        {shown.map((photo, i) => (
          <li key={`${photo.image}-${i}`} className="w-full">
            <Reveal scaleFrom={1} yFrom={24} className="w-full">
              <figure className="m-0 flex flex-col items-start">
                <button
                  type="button"
                  aria-label={`${labels.open}: ${photo.caption || i + 1}`}
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
                    sizes={compact ? "(max-width: 1199px) 50vw, 320px" : "(max-width: 1199px) 50vw, 440px"}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
                {!compact && photo.caption ? (
                  <figcaption className="t-body mt-3 border-s-2 border-gold ps-3 leading-7">{photo.caption}</figcaption>
                ) : null}
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>

      <Lightbox photos={shown} index={index} labels={labels} rtl={rtl} onClose={close} onStep={step} />
    </>
  );
}
