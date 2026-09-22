import SolidButton from "@/components/ui/SolidButton";
import Reveal from "@/components/ui/Reveal";
import type { SiteContent } from "@/types/content";

/**
 * 1225x430 navy card, padding 80, content bottom-aligned (gap 32). Enters from
 * scale(.9) translateY(70). A 451x282 dash ornament is pinned to the trailing
 * half of the card and mirrors with the document direction.
 */
export default function CtaSection({
  content,
}: {
  content: SiteContent["cta"];
}) {
  return (
    <section
      id="contact"
      className="mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 py-14 xl:px-25 xl:py-[140px]"
    >
      <Reveal yFrom={70} className="w-full">
        <div className="relative flex w-full flex-col items-start justify-end gap-8 overflow-hidden bg-navy p-6 xl:h-[430px] xl:p-20">
          <div className="relative z-10 flex flex-col items-start gap-2.5">
            <h2 className="t-h2 text-white xl:max-w-[532px]">
              {content.heading}
            </h2>
            <p className="t-body-lg text-[#ccdce6] xl:max-w-[479px]">
              {content.body}
            </p>
          </div>

          <SolidButton
            href={content.href}
            variant="gold"
            className="relative z-10"
          >
            {content.button}
          </SolidButton>

          <div
            aria-hidden
            className="ornament-flip pointer-events-none absolute start-[641px] top-[144px] hidden h-[282px] w-[451px] overflow-hidden xl:block"
            style={{ backgroundImage: "url(/svg/ornament-cta.svg)" }}
          />
        </div>
      </Reveal>
    </section>
  );
}
