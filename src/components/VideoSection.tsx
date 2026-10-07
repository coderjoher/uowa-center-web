"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import type { VideoBlock } from "@/types/content";

/**
 * A playable video, unlike the muted campus band: heading and a line of copy
 * on the inline-start side, the video on a 16:9 frame beside it. At rest it
 * shows the poster with a large gold play button; a click swaps in the
 * native player with controls and sound and starts it. The video file is
 * only requested once the button is pressed (`preload="none"`), so it costs
 * nothing until someone wants it. All of it is editable from the admin, and
 * the section can be switched off in the settings.
 */
export default function VideoSection({ content }: { content: VideoBlock }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const start = () => {
    setStarted(true);
    requestAnimationFrame(() => ref.current?.play().catch(() => {}));
  };

  return (
    <section
      id="video"
      className="mx-auto flex w-full max-w-[1520px] scroll-mt-24 flex-col gap-8 px-5 py-14 xl:flex-row xl:items-center xl:gap-20 xl:px-25 xl:py-[120px]"
    >
      <div className="flex flex-col items-start gap-4 xl:w-[380px] xl:shrink-0">
        <SectionLabel className="text-navy">{content.label}</SectionLabel>
        <h2 className="t-h2">
          {content.heading.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
        <p className="t-body-lg">{content.body}</p>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-navy">
        <video
          ref={ref}
          src={content.src}
          poster={content.poster}
          controls={started}
          preload="none"
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        {!started ? (
          <button
            type="button"
            onClick={start}
            aria-label={content.play}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center"
          >
            <Image src={content.poster} alt="" fill sizes="(max-width: 1199px) 100vw, 900px" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-navy/35 transition-colors duration-300 group-hover:bg-navy/20" />
            <span
              aria-hidden
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gold text-navy shadow-[0_10px_30px_-8px_rgb(0_0_0/0.5)] transition-transform duration-300 group-hover:scale-110 xl:h-24 xl:w-24"
            >
              {/* Play triangle; not mirrored, a play mark points right in both scripts. */}
              <svg viewBox="0 0 24 24" className="ms-1 h-8 w-8 xl:h-9 xl:w-9" fill="currentColor">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
              </svg>
            </span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
