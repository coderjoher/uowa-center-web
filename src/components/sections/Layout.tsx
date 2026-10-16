import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import FeatureCards from "@/components/FeatureCards";
import VideoSection from "@/components/VideoSection";
import DirectorMessage from "@/components/DirectorMessage";
import OverviewSection from "@/components/OverviewSection";
import ServicesSection from "@/components/ServicesSection";
import StructureSection from "@/components/StructureSection";
import TeamSection from "@/components/TeamSection";
import EventsSection from "@/components/EventsSection";
import PlanTable from "@/components/PlanTable";
import GallerySection from "@/components/GallerySection";
import MilestonesSection from "@/components/MilestonesSection";
import FaqSection from "@/components/FaqSection";
import CtaSection from "@/components/CtaSection";
import NewsSection from "@/components/NewsSection";
import NewsletterSection from "@/components/NewsletterSection";
import { BlockView } from "@/components/blocks/Blocks";
import { dirOf, type Locale } from "@/i18n/config";
import type { Block, LayoutItem, SectionKey, SiteContent } from "@/types/content";

/** One of the site's built-in sections, with the content it needs. */
export function SectionView({ section, c, lang }: { section: SectionKey; c: SiteContent; lang: Locale }) {
  switch (section) {
    case "hero":
      return <Hero content={c.hero} brand={c.brand} services={c.services.items} />;
    case "about":
      return <AboutSection content={c.about} />;
    case "features":
      return <FeatureCards features={c.features} />;
    case "video":
      return <VideoSection content={c.video} />;
    case "director":
      return <DirectorMessage content={c.director} />;
    case "overview":
      return <OverviewSection content={c.overview} />;
    case "services":
      return <ServicesSection content={c.services} lang={lang} />;
    case "structure":
      return <StructureSection content={c.structure} />;
    case "team":
      return <TeamSection content={c.team} />;
    case "events":
      return <EventsSection content={c.events} />;
    case "plan":
      return <PlanTable content={c.plan} />;
    case "gallery":
      return <GallerySection content={c.gallery} lightbox={c.pages.gallery.lightbox} lang={lang} />;
    case "milestones":
      return <MilestonesSection content={c.milestones} lang={lang} />;
    case "faq":
      return <FaqSection content={c.faq} />;
    case "cta":
      return <CtaSection content={c.cta} />;
    case "news":
      return <NewsSection content={c.news} />;
    case "newsletter":
      return <NewsletterSection content={c.newsletter} />;
    default:
      return null;
  }
}

/**
 * Renders a page's layout from the page builder: built-in sections and
 * blocks, in order, skipping hidden ones. Each entry is wrapped in a
 * layout-neutral element that names its place in the layout, which the
 * admin's live preview uses to tell which layer was clicked.
 */
export default function Layout({
  items,
  c,
  lang,
  at,
}: {
  items: LayoutItem[] | undefined;
  c: SiteContent;
  lang: Locale;
  /** Where the layout lives in the content, e.g. "homeLayout" or "customPages.2.blocks". */
  at: string;
}) {
  return (
    <>
      {(items ?? []).map((item, i) =>
        item.hidden ? null : (
          <div key={i} className="contents" data-layer={`${at}.${i}`}>
            {item.type === "section" ? <SectionView section={item.section} c={c} lang={lang} /> : <BlockView block={item as Block} lightbox={c.pages.gallery.lightbox} rtl={dirOf(lang) === "rtl"} />}
          </div>
        ),
      )}
    </>
  );
}
