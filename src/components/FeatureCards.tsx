import Reveal from "@/components/ui/Reveal";
import { FeatureIcon } from "@/components/icons";
import type { Feature } from "@/types/content";

/**
 * Desktop: a 380px strip on `#eef4f8`, overflow hidden, inner padding 100px.
 * Three 382x180 cards, gap 40, all on the same baseline. They enter with a
 * zig-zag: translateY(+50) / (-50) / (+50) settling to 0.
 *
 * Phone: stacking the cards as three icon-over-text blocks made the strip a
 * screen and a half tall. Below 1200px each feature is a compact row — the
 * icon sits on the inline-start side and the title and copy run beside it —
 * separated by hairlines, and the zig-zag entrance collapses to a plain rise.
 */
export default function FeatureCards({ features }: { features: Feature[] }) {
  return (
    <section className="relative overflow-hidden bg-surface">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col items-start divide-y divide-navy/10 px-5 py-4 xl:h-[380px] xl:flex-row xl:justify-center xl:gap-10 xl:divide-y-0 xl:px-25 xl:py-25">
        {features.map((feature) => (
          <Reveal
            key={feature.title}
            scaleFrom={1}
            yFrom={feature.offsetY}
            className="w-full py-5 xl:w-[382px] xl:py-0"
          >
            <div className="flex w-full items-start gap-4 xl:flex-col xl:gap-6">
              <FeatureIcon
                name={feature.icon}
                className="h-11 w-11 shrink-0 xl:h-16 xl:w-16"
              />
              <div className="flex min-w-0 flex-col items-start gap-1 xl:gap-2">
                <h4 className="t-h4">{feature.title}</h4>
                <p className="t-body text-[15px] xl:text-[16px]">{feature.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
