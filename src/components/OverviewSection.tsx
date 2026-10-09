import SectionLabel from "@/components/ui/SectionLabel";
import type { SiteContent } from "@/types/content";
import RichText from "@/components/ui/RichText";

/**
 * Vision and mission as a matched pair of cards — the first navy, the second
 * outlined — followed by the numbered objectives in a two-column grid.
 */
export default function OverviewSection({
  content,
}: {
  content: SiteContent["overview"];
}) {
  const [vision, mission] = content.pillars;

  return (
    <section
      id="overview"
      className="scroll-mt-24 bg-surface py-14 xl:py-[140px]"
    >
      <div className="mx-auto flex w-full max-w-[1520px] flex-col items-start gap-8 px-5 xl:gap-[70px] xl:px-25">
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

        {/* Vision / mission */}
        <div className="flex w-full flex-col gap-6 xl:flex-row xl:gap-10">
          <article className="flex w-full flex-col items-start gap-4 border-s-4 border-gold bg-navy p-6 xl:flex-1 xl:p-14">
            <h3 className="t-h4 text-white">{vision.title}</h3>
            <RichText value={vision.body} className="t-body-lg text-[#ccdce6]" />
          </article>

          <article className="flex w-full flex-col items-start gap-4 border border-border-soft bg-white p-6 xl:flex-1 xl:p-14">
            <h3 className="t-h4">{mission.title}</h3>
            <RichText value={mission.body} className="t-body-lg" />
          </article>
        </div>

        {/* Objectives */}
        <div className="flex w-full flex-col items-start gap-8">
          <h3 className="t-h4">{content.objectivesTitle}</h3>
          <ol className="grid w-full list-none grid-cols-1 gap-x-10 gap-y-6 p-0 xl:grid-cols-2">
            {content.objectives.map((objective, i) => (
              <li key={objective} className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center bg-navy font-[family-name:var(--font-heading)] text-[14px] font-bold leading-none text-white"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="t-body">{objective}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
