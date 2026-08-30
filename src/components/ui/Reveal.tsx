"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reproduces the Framer Motion "appear" springs on the page.
 * FeatureCards enter from translateY(±50), Events rows from translateY(45),
 * Gallery cards from scale(.9) translateY(55) and the CTA card from
 * scale(.9) translateY(70); all settle at scale(1) translateY(0).
 *
 * Reduced motion is handled in CSS (see `.reveal` in globals.css) rather than
 * in the effect, so the observer callback is the only thing that sets state.
 */
export default function Reveal({
  children,
  scaleFrom = 0.9,
  yFrom = 55,
  className = "",
}: {
  children: React.ReactNode;
  scaleFrom?: number;
  yFrom?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown ? "true" : "false"}
      className={`reveal ${className}`}
      style={
        {
          "--reveal-from": `scale(${scaleFrom}) translateY(${yFrom}px)`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
