"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import CircuitPattern from "@/components/ui/CircuitPattern";
import type { VideoBlock } from "@/types/content";
import RichText from "@/components/ui/RichText";

/** The 11-character ID from a YouTube link, embed URL or bare ID. */
function youtubeId(value?: string): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = v.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Seconds as m:ss. */
function clock(t: number): string {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* Icons, drawn on a 24 grid in the site's stroke weight. */
const Play = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);
const Pause = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);
const Speaker = ({ muted }: { muted: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
    {muted ? (
      <path d="M16 9.5l5 5m0-5l-5 5" />
    ) : (
      <>
        <path d="M15.5 9a4 4 0 0 1 0 6" />
        <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
      </>
    )}
  </svg>
);
const Expand = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {on ? (
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
    ) : (
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    )}
  </svg>
);

/**
 * A playable video in the site's own idiom rather than the browser's stock
 * player: heading and copy on the inline-start side, the video on a 16:9
 * frame beside it with a gold edge on its start side, like the site's navy
 * plaques.
 *
 * At rest it shows the poster under a navy wash with the circuit pattern
 * and a large gold play button. Once started, the native controls stay off
 * and a navy control bar rises from the bottom: a gold play/pause button,
 * the elapsed and total time in Somar, a seek bar with a gold fill on a pale
 * track, mute with a volume slider (wider screens), and full screen. The
 * bar hides itself 2.5s into playback when the pointer is still and returns
 * on any movement, focus or pause; a paused video shows the gold play mark
 * again in the middle. A gold ring spins while the browser is buffering.
 *
 * Keyboard, when the player has focus: Space or K play/pause, the arrows
 * skip 5s, M mutes, F toggles full screen. The bar follows the page
 * direction, so the seek fill grows from the inline start in Arabic, as it
 * does in Arabic YouTube. The file is requested only on the first play.
 *
 * When a YouTube link or ID is set, the same poster and gold play button
 * start a privacy-enhanced YouTube embed in the frame instead, with
 * YouTube's own controls.
 */
export default function VideoSection({ content }: { content: VideoBlock }) {
  const frame = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [full, setFull] = useState(false);
  const [chrome, setChrome] = useState(true);

  const c = content.controls;
  /* A YouTube video, when one is set, plays in an embed instead of the file. */
  const yt = youtubeId(content.youtube);

  /* Show the bar, and schedule it to hide again while playing. */
  const wake = useCallback(() => {
    setChrome(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (ref.current && !ref.current.paused) setChrome(false);
    }, 2500);
  }, []);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    wake();
  }, [wake]);

  const start = () => {
    setStarted(true);
    if (yt) return;
    requestAnimationFrame(() => {
      ref.current?.play().catch(() => {});
      frame.current?.focus({ preventScroll: true });
    });
    wake();
  };

  const seekTo = (t: number) => {
    const v = ref.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.min(Math.max(t, 0), v.duration);
    setTime(v.currentTime);
    wake();
  };

  const toggleMute = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.6;
    wake();
  }, [wake]);

  const toggleFull = useCallback(() => {
    const el = frame.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
    wake();
  }, [wake]);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (!started) return;
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT") return; // sliders handle their own keys
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") {
      e.preventDefault();
      toggle();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      seekTo(time + (e.key === "ArrowRight" ? 5 : -5));
    } else if (k === "m") toggleMute();
    else if (k === "f") toggleFull();
  };

  const pct = duration ? (time / duration) * 100 : 0;
  const vol = muted ? 0 : volume * 100;
  const iconBtn =
    "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-white transition-colors duration-200 hover:text-gold focus-visible:text-gold focus-visible:outline-none";

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
        <RichText value={content.body} className="t-body-lg" />
      </div>

      <div
        ref={frame}
        tabIndex={started ? 0 : -1}
        onKeyDown={onKey}
        onPointerMove={started ? wake : undefined}
        className={`group/player relative aspect-video w-full overflow-hidden border-s-4 border-gold bg-navy outline-none ${
          full ? "" : "rounded-e-md"
        } ${started && !chrome && playing ? "cursor-none" : ""}`}
      >
        {yt && started ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={content.heading.join(" ")}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : null}
        {yt ? null : (
        <video
          ref={ref}
          poster={content.poster}
          preload="none"
          playsInline
          onClick={toggle}
          onPlay={() => {
            setPlaying(true);
            wake();
          }}
          onPause={() => {
            setPlaying(false);
            setChrome(true);
          }}
          onEnded={() => setChrome(true)}
          onWaiting={() => setWaiting(true)}
          onPlaying={() => setWaiting(false)}
          onCanPlay={() => setWaiting(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onVolumeChange={(e) => {
            setMuted(e.currentTarget.muted);
            setVolume(e.currentTarget.volume);
          }}
          className="absolute inset-0 h-full w-full object-contain"
        >
          <source src={content.src} type="video/mp4" />
          {content.srcWebm ? <source src={content.srcWebm} type="video/webm" /> : null}
        </video>
        )}

        {/* Poster state */}
        {!started ? (
          <button
            type="button"
            onClick={start}
            aria-label={content.play}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center"
          >
            <Image src={content.poster} alt="" fill sizes="(max-width: 1199px) 100vw, 900px" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-linear-to-t from-navy/80 via-navy/40 to-navy/20 transition-colors duration-300" />
            <CircuitPattern className="absolute inset-0 h-full w-full opacity-60" />
            <span
              aria-hidden
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gold text-navy shadow-[0_10px_30px_-8px_rgb(0_0_0/0.5)] ring-8 ring-gold/25 transition-transform duration-300 group-hover:scale-110 xl:h-24 xl:w-24"
            >
              <svg viewBox="0 0 24 24" className="ms-1 h-8 w-8 xl:h-9 xl:w-9" fill="currentColor">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
              </svg>
            </span>
          </button>
        ) : null}

        {/* Centre mark while paused, and the buffering ring */}
        {started && !playing && !yt ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={content.play}
            className="absolute start-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-gold text-navy ring-8 ring-gold/25 transition-transform duration-200 hover:scale-110 rtl:translate-x-1/2 xl:h-20 xl:w-20"
          >
            <svg viewBox="0 0 24 24" className="ms-1 h-7 w-7" fill="currentColor" aria-hidden>
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
          </button>
        ) : null}
        {started && waiting && playing ? (
          <span
            aria-hidden
            className="pointer-events-none absolute start-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-white/20 border-t-gold rtl:translate-x-1/2"
          />
        ) : null}

        {/* Control bar (YouTube embeds bring their own) */}
        {started && !yt ? (
          <div
            className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-navy via-navy/85 to-transparent px-3 pb-2 pt-10 transition-[opacity,transform] duration-300 xl:px-5 xl:pb-3 ${
              chrome ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            }`}
            onFocus={wake}
          >
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={time}
              aria-label={c.seek}
              aria-valuetext={`${clock(time)} / ${clock(duration)}`}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="player-range block w-full"
              style={{ "--fill": `${pct}%` } as React.CSSProperties}
            />
            <div className="mt-1 flex items-center gap-1">
              <button type="button" onClick={toggle} aria-label={playing ? c.pause : content.play} className="me-1 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gold text-navy transition-transform duration-200 hover:scale-105">
                {playing ? <Pause /> : <span className="ms-0.5"><Play /></span>}
              </button>
              <span dir="ltr" className="ms-2 font-[family-name:var(--font-sans)] text-[13px] tabular-nums text-pale">
                {clock(time)} <span className="text-white/40">/</span> {clock(duration)}
              </span>

              <span className="flex-1" />

              <div className="flex items-center">
                <button type="button" onClick={toggleMute} aria-label={muted || volume === 0 ? c.unmute : c.mute} className={iconBtn}>
                  <Speaker muted={muted || volume === 0} />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  aria-label={c.volume}
                  onChange={(e) => {
                    const v = ref.current;
                    if (!v) return;
                    v.volume = Number(e.target.value);
                    v.muted = v.volume === 0;
                    wake();
                  }}
                  className="player-range player-range-sm hidden w-20 sm:block"
                  style={{ "--fill": `${vol}%` } as React.CSSProperties}
                />
              </div>
              <button type="button" onClick={toggleFull} aria-label={full ? c.exitFullscreen : c.fullscreen} className={iconBtn}>
                <Expand on={full} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
