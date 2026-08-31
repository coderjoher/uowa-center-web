"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { CarouselArrowIcon } from "@/components/icons";
import { dirOf, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/**
 * The `/gallery` grid, with a lightbox.
 *
 * Each tile is a button that opens the overlay at its index. While the overlay
 * is up the page behind it is frozen — both `overflow: hidden` on the body and
 * a `lenis.stop()`, since Lenis drives the scroll and ignores the former.
 *
 * The arrow keys are mapped by physical direction rather than by "next": the
 * grid reads right-to-left in Arabic, so ArrowLeft advances there and goes back
 * in English.
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
  const open = index !== null;
  const closeRef = useRef<HTMLButtonElement>(null);
  /** Focus is handed back to the tile that opened the overlay. */
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const step = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  const close = useCallback(() => {
    setIndex(null);
    openerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(rtl ? -1 : 1);
      else if (event.key === "ArrowLeft") step(rtl ? 1 : -1);
    };
    document.addEventListener("keydown", onKey);

    const lenis = (window as unknown as {
      lenis?: { stop(): void; start(): void };
    }).lenis;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [open, close, step, rtl]);

  const active = index === null ? null : photos[index];
  /** Precomputed so the JSX does not have to re-narrow `index`. */
  const counter = index === null ? "" : `${index + 1} / ${photos.length}`;

  return (
    <section className="mx-auto w-full max-w-[1520px] px-5 pb-20 xl:px-25 xl:pb-[140px]">
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

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          data-lenis-prevent
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col bg-navy/95 backdrop-blur-sm"
        >
          {/* Bar */}
          <div className="flex shrink-0 items-center justify-between px-5 py-4 xl:px-10">
            <p dir="ltr" className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-[#ccdce6]">
              {counter}
            </p>
            <button
              ref={closeRef}
              type="button"
              aria-label={lightbox.close}
              onClick={close}
              className="relative h-11 w-11 shrink-0 cursor-pointer"
            >
              <span className="absolute left-1/2 top-1/2 h-0.5 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[10px] bg-surface" />
              <span className="absolute left-1/2 top-1/2 h-0.5 w-6 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-[10px] bg-surface" />
            </button>
          </div>

          {/* Stage — the click guard keeps a tap on the photo from closing */}
          <div className="flex min-h-0 flex-1 items-center gap-3 px-3 pb-4 xl:gap-8 xl:px-10">
            <button
              type="button"
              aria-label={lightbox.prev}
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 xl:h-12 xl:w-12"
            >
              <CarouselArrowIcon direction={rtl ? "right" : "left"} />
            </button>

            <div
              onClick={(event) => event.stopPropagation()}
              className="relative min-h-0 flex-1 self-stretch"
            >
              <Image
                key={active.image}
                src={active.image}
                alt={active.caption}
                fill
                sizes="100vw"
                className="panel-in object-contain"
              />
            </div>

            <button
              type="button"
              aria-label={lightbox.next}
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 xl:h-12 xl:w-12"
            >
              <CarouselArrowIcon direction={rtl ? "left" : "right"} />
            </button>
          </div>

          <p className="shrink-0 px-5 pb-8 text-center font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-white xl:px-10">
            {active.caption}
          </p>
        </div>
      ) : null}
    </section>
  );
}
