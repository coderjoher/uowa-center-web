import Image from "next/image";
import SolidButton from "@/components/ui/SolidButton";
import type { SiteContent } from "@/types/content";

/**
 * Row 1 — h1 (max-w 625) inline-start / paragraph + CTA (max-w 467) inline-end.
 * Row 2 — full-bleed campus photo, 250px tall, 500px from 1200px up.
 */
export default function Hero({ content }: { content: SiteContent["hero"] }) {
  return (
    <header className="relative flex flex-col items-center gap-14 pt-25 xl:pt-[156px]">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col items-start justify-between gap-[30px] px-5 xl:flex-row xl:px-25">
        <div className="w-full xl:max-w-[625px]">
          <h1 className="t-h1">{content.heading}</h1>
        </div>

        <div className="flex w-full flex-col items-start gap-7 xl:max-w-[467px]">
          <p className="t-body-lg">{content.body}</p>
          <SolidButton href="#services">{content.cta}</SolidButton>
        </div>
      </div>

      <div className="relative h-[250px] w-full xl:h-[500px]">
        <Image
          src="/images/hero-campus.jpg"
          alt={content.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </header>
  );
}
