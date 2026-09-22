"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { CarouselArrowIcon } from "@/components/icons";

export interface LightboxPhoto {
  image: string;
  caption: string;
}

export interface LightboxLabels {
  /** Prefix for each tile's accessible name; the viewer itself does not use it. */
  open: string;
  close: string;
  prev: string;
  next: string;
}

/**
 * Full-screen photo viewer shared by the `/gallery` grid and the home-page
 * mosaic. The parent owns the open index; this renders nothing until it is a
 * number. While it is up the page behind is frozen — `overflow: hidden` on
 * the body and a `lenis.stop()`, since Lenis drives the scroll and ignores
 * the former — and focus lands on the close button.
 *
 * The overlay fades in, each photo plays `.panel-in` as it changes, and a
 * horizontal swipe on the stage steps to the neighbour. The arrow keys and
 * the swipe are mapped by physical direction rather than by "next": the
 * gallery reads right-to-left in Arabic, so a swipe to the left advances in
 * English and goes back in Arabic.
 */
export default function Lightbox({
  photos,
  index,
  labels,
  rtl,
  onClose,
  onStep,
}: {
  photos: LightboxPhoto[];
  index: number | null;
  labels: LightboxLabels;
  rtl: boolean;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
}) {
  const open = index !== null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") onStep(rtl ? -1 : 1);
      else if (event.key === "ArrowLeft") onStep(rtl ? 1 : -1);
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
  }, [open, onClose, onStep, rtl]);

  if (index === null) return null;
  const active = photos[index];
  const counter = `${index + 1} / ${photos.length}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={active.caption}
      data-lenis-prevent
      onClick={onClose}
      className="overlay-in fixed inset-0 z-50 flex flex-col bg-navy/95 backdrop-blur-sm"
    >
      {/* Bar */}
      <div className="flex shrink-0 items-center justify-between px-5 py-4 xl:px-10">
        <p dir="ltr" className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-[#ccdce6]">
          {counter}
        </p>
        <button
          ref={closeRef}
          type="button"
          aria-label={labels.close}
          onClick={onClose}
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
          aria-label={labels.prev}
          onClick={(event) => {
            event.stopPropagation();
            onStep(-1);
          }}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 xl:h-12 xl:w-12"
        >
          <CarouselArrowIcon direction={rtl ? "right" : "left"} />
        </button>

        <div
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            dragStart.current = event.clientX;
          }}
          onPointerUp={(event) => {
            const start = dragStart.current;
            dragStart.current = null;
            if (start === null) return;
            const delta = event.clientX - start;
            if (Math.abs(delta) < 40) return;
            /* A swipe to the left pulls the next photo in from the right in
               English; in Arabic the next photo sits on the left. */
            onStep((delta < 0) !== rtl ? 1 : -1);
          }}
          onPointerCancel={() => {
            dragStart.current = null;
          }}
          className="relative min-h-0 flex-1 touch-pan-y select-none self-stretch"
        >
          <Image
            key={active.image}
            src={active.image}
            alt={active.caption}
            fill
            sizes="100vw"
            draggable={false}
            className="panel-in object-contain"
          />
        </div>

        <button
          type="button"
          aria-label={labels.next}
          onClick={(event) => {
            event.stopPropagation();
            onStep(1);
          }}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 xl:h-12 xl:w-12"
        >
          <CarouselArrowIcon direction={rtl ? "left" : "right"} />
        </button>
      </div>

      <p
        key={active.image}
        className="panel-in shrink-0 px-5 pb-8 text-center font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-white xl:px-10"
      >
        {active.caption}
      </p>
    </div>
  );
}
