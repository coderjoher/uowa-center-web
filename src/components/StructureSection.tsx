import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import type { SiteContent } from "@/types/content";

/**
 * The org chart: a navy root node for the head of department, a centred
 * connector down to a full-width rule, then the divisions as cards that hang
 * off that rule via their own 2px top border.
 *
 * The connectors are all centred or full-width, so the whole diagram is
 * symmetric and needs no direction-specific rules under RTL.
 */
export default function StructureSection({
  content,
}: {
  content: SiteContent["structure"];
}) {
  return (
    <section
      id="structure"
      className="mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 pb-14 xl:px-25 xl:pb-[112px]"
    >
      <div className="flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-end">
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
        <p className="t-body xl:max-w-[520px]">{content.intro}</p>
      </div>

      {/* Root node */}
      <div className="mt-8 flex flex-col items-center xl:mt-16">
        <div className="flex w-full max-w-[420px] flex-col items-center gap-1.5 bg-navy px-8 py-6 text-center">
          <h3 className="t-h4 text-white">{content.rootTitle}</h3>
          <p className="t-body text-[#ccdce6]">{content.rootNote}</p>
        </div>
        <span aria-hidden className="h-12 w-px bg-navy" />
      </div>

      {/* Spine + divisions */}
      <div className="h-px w-full bg-navy" />
      <ol className="grid list-none grid-cols-1 gap-x-10 gap-y-8 p-0 pt-0 xl:grid-cols-3">
        {content.divisions.map((division, i) => (
          <li key={division.title} className="w-full">
            <Reveal scaleFrom={1} yFrom={30} className="w-full">
              <div className="flex flex-col items-start gap-3 border-t-2 border-navy pt-6">
                <span
                  aria-hidden
                  className="font-[family-name:var(--font-heading)] text-[14px] font-bold leading-none text-muted"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h4 className="t-h4">{division.title}</h4>
                <p className="t-body">{division.scope}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
