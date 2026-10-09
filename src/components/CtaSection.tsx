import SolidButton from "@/components/ui/SolidButton";
import Reveal from "@/components/ui/Reveal";
import CircuitPattern from "@/components/ui/CircuitPattern";
import type { SiteContent } from "@/types/content";
import RichText from "@/components/ui/RichText";

/**
 * The "need technical support?" band. A compact navy strip rather than the
 * full-height card it used to be: heading and one line of copy on the
 * inline-start side, the gold button on the inline-end side (stacked on
 * phones), with the circuit ornament and its moving pulses filling the
 * ground behind the button. Gold edge on the start side, as on the site's
 * other navy plaques.
 */
export default function CtaSection({
  content,
}: {
  content: SiteContent["cta"];
}) {
  return (
    <section
      id="contact"
      className="mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 py-12 xl:px-25 xl:py-20"
    >
      <Reveal yFrom={40} scaleFrom={1} className="w-full">
        <div className="relative isolate flex w-full flex-col items-start gap-6 overflow-hidden border-s-4 border-gold bg-navy px-6 py-8 xl:flex-row xl:items-center xl:justify-between xl:gap-12 xl:px-14 xl:py-11">
          <CircuitPattern className="absolute inset-y-0 end-0 -z-10 h-full w-full opacity-70 xl:w-[55%]" />
          <div className="flex flex-col items-start gap-2 xl:max-w-[640px]">
            <h2 className="t-h2 text-white xl:text-[30px]">{content.heading}</h2>
            <RichText value={content.body} className="t-body text-[#ccdce6]" />
          </div>
          <SolidButton href={content.href} variant="gold" className="shrink-0">
            {content.button}
          </SolidButton>
        </div>
      </Reveal>
    </section>
  );
}
