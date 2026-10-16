"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import SolidButton from "@/components/ui/SolidButton";
import Reveal from "@/components/ui/Reveal";
import Lightbox, { type LightboxLabels } from "@/components/ui/Lightbox";
import { ArrowUpRightThinIcon } from "@/components/icons";
import { dirOf, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/**
 * Home-page gallery teaser: a four-tile photo mosaic — one tall tile spanning
 * two rows, three landscape tiles beside it — and a narrow column holding
 * only the label, the heading and the link to the full gallery. The photos
 * carry the section, so nothing is written on them at rest.
 *
 * The mosaic shows the first four photos however many there are (it used to
 * add a tile per photo, and rows past the second collapsed to nothing). Every
 * tile is a button into the shared Lightbox, which holds every photo; when
 * there are more than the mosaic shows, the last tile says how many more.
 * Phones drop the fourth tile. The
 * tiles enter one after another, rising and fading, and respond to touch and
 * hover: the photo eases up a few percent and a navy gradient with the
 * photo's title and an expand mark slides in from the bottom. Where hover is
 * unavailable the gradient stays on, so the tiles read as tappable.
 */
export default function GallerySection({
  content,
  lightbox,
  lang,
}: {
  content: SiteContent["gallery"];
  lightbox: LightboxLabels;
  lang: Locale;
}) {
  const rtl = dirOf(lang) === "rtl";
  const photos = content.items.filter((item) => item.image).map((item) => ({
    image: item.image,
    caption: item.title,
  }));

  const [index, setIndex] = useState<number | null>(null);
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

  const tiles = photos.slice(0, 4).map((photo) => ({ image: photo.image, title: photo.caption }));
  const hiddenCount = photos.length - tiles.length;

  /** Grid placement per tile: tall, wide, small, small (the last is desktop-only). */
  const placement = [
    "row-span-2",
    "xl:col-span-2",
    "",
    "hidden xl:block",
  ];
  const sizes = [
    "(max-width: 1199px) 50vw, 260px",
    "(max-width: 1199px) 50vw, 520px",
    "(max-width: 1199px) 50vw, 260px",
    "260px",
  ];

  return (
    <section
      id="gallery"
      className="relative mx-auto flex w-full max-w-[1520px] scroll-mt-24 flex-col gap-8 px-5 py-14 xl:flex-row xl:items-end xl:justify-between xl:px-25 xl:py-[112px]"
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
      <ul className="grid w-full list-none grid-cols-2 grid-rows-[200px_200px] gap-4 p-0 xl:w-[796px] xl:grid-cols-3 xl:grid-rows-[260px_260px] xl:gap-5">
        {tiles.map((tile, i) => (
          <li key={`${tile.image}-${i}`} className={`relative ${placement[i] ?? ""}`}>
            <Reveal
              scaleFrom={0.96}
              yFrom={40}
              delay={i * 110}
              fade
              className="h-full w-full"
            >
              <button
                type="button"
                aria-label={`${lightbox.open}: ${tile.title}`}
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setIndex(i);
                }}
                className="group relative block h-full w-full cursor-zoom-in overflow-hidden bg-surface text-start outline-offset-4"
              >
                <Image
                  src={tile.image}
                  alt={tile.title}
                  fill
                  sizes={sizes[i]}
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06] group-active:scale-[1.03]"
                />
                {hiddenCount > 0 && i === tiles.length - 1 ? (
                  <span
                    aria-hidden
                    dir="ltr"
                    className="absolute inset-0 flex items-center justify-center bg-navy/55 font-[family-name:var(--font-heading)] text-[34px] font-semibold text-white"
                  >
                    +{hiddenCount}
                  </span>
                ) : null}
                {/* Title plate: on by default, hover-revealed where hover exists */}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-navy/85 via-navy/35 to-transparent p-4 transition-opacity duration-500 xl:p-5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100">
                  <span className="t-h5 translate-y-0 text-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-focus-visible:translate-y-0">
                    {tile.title}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-navy rtl:-scale-x-100">
                    <ArrowUpRightThinIcon />
                  </span>
                </span>
              </button>
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
