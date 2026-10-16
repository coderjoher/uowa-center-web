import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SiteContent } from "@/types/content";
import RichText from "@/components/ui/RichText";

/**
 * The director's word. Portrait on the leading side (480x560 on desktop) with
 * the navy signature card overlapping its trailing edge, echoing the About
 * composition; the message itself runs down the trailing column.
 *
 * The source photo is a 684x774 portrait, so the desktop box crops almost
 * nothing; the mobile box is 380 tall rather than 280 so the subject still
 * reads once the frame goes landscape.
 */
export default function DirectorMessage({
  content,
}: {
  content: SiteContent["director"];
}) {
  return (
    <section
      id="director"
      className="mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 py-14 xl:flex xl:items-start xl:justify-between xl:gap-20 xl:px-25 xl:py-[112px]"
    >
      {/* Photo + signature */}
      <div className="relative w-full shrink-0 xl:w-[480px]">
        <div className="relative h-[380px] w-full xl:h-[560px]">
          <Image
            src={content.image}
            alt={content.imageAlt}
            fill
            sizes="(max-width: 1199px) 100vw, 480px"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col items-start gap-1 border-s-4 border-gold bg-navy p-6 xl:absolute xl:bottom-0 xl:end-[-60px] xl:w-[360px] xl:px-10 xl:py-8">
          <p className="font-[family-name:var(--font-heading)] text-[18px] font-bold leading-7 text-white xl:text-[20px] xl:leading-8">
            {content.name}
          </p>
          <p className="t-body text-[#ccdce6]">{content.role}</p>
        </div>
      </div>

      {/* Message */}
      <div className="mt-8 flex w-full flex-col items-start gap-6 xl:mt-0 xl:max-w-[620px]">
        <div className="flex flex-col items-start gap-4">
          <SectionLabel className="text-navy">{content.label}</SectionLabel>
          <h2 className="t-h2">{content.heading}</h2>
        </div>

        {/* 4px navy rule pinned to the inline start of the message body */}
        <div className="relative flex flex-col items-start gap-5 ps-6">
          <span aria-hidden className="absolute start-0 top-0 h-full w-1 bg-navy" />
          <RichText value={content.body} className="t-body-lg" />
        </div>
      </div>
    </section>
  );
}
