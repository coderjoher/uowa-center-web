import Reveal from "@/components/ui/Reveal";
import { FeatureIcon } from "@/components/icons";
import type { Feature } from "@/types/content";

/**
 * 380px strip on `#eef4f8`, overflow hidden, inner padding 100px.
 * Three 382x180 cards, gap 40, all on the same baseline. They enter with a
 * zig-zag: translateY(+50) / (-50) / (+50) settling to 0.
 */
export default function FeatureCards({ features }: { features: Feature[] }) {
  return (
    <section className="relative overflow-hidden bg-surface">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col items-start gap-10 px-5 py-15 xl:h-[380px] xl:flex-row xl:justify-center xl:px-25 xl:py-25">
        {features.map((feature) => (
          <Reveal
            key={feature.title}
            scaleFrom={1}
            yFrom={feature.offsetY}
            className="w-full xl:w-[382px]"
          >
            <div className="flex w-full flex-col items-start gap-6">
              <FeatureIcon name={feature.icon} className="h-16 w-16 shrink-0" />
              <div className="flex flex-col items-start gap-2">
                <h4 className="t-h4">{feature.title}</h4>
                <p className="t-body">{feature.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
