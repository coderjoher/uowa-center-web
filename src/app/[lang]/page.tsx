import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import FeatureCards from "@/components/FeatureCards";
import VideoSection from "@/components/VideoSection";
import DirectorMessage from "@/components/DirectorMessage";
import ServicesSection from "@/components/ServicesSection";
import StructureSection from "@/components/StructureSection";
import TeamSection from "@/components/TeamSection";
import CampusBanner from "@/components/CampusBanner";
import EventsSection from "@/components/EventsSection";
import GallerySection from "@/components/GallerySection";
import FaqSection from "@/components/FaqSection";
import CtaSection from "@/components/CtaSection";
import NewsSection from "@/components/NewsSection";
import NewsletterSection from "@/components/NewsletterSection";
import SiteFooter from "@/components/SiteFooter";
import Blocks from "@/components/blocks/Blocks";
import { getContent } from "@/data";
import { isLocale } from "@/i18n/config";
import { isSectionVisible } from "@/config/sections";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const c = await getContent(lang);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <Hero content={c.hero} brand={c.brand} services={c.services.items} />
        {/* Blocks added in the admin under "أقسام إضافية في الرئيسية". */}
        <Blocks blocks={c.homeBlocks?.afterHero} />
        {isSectionVisible(c, "about") ? <AboutSection content={c.about} /> : null}
        {isSectionVisible(c, "features") ? <FeatureCards features={c.features} /> : null}
        {isSectionVisible(c, "video") ? <VideoSection content={c.video} /> : null}
        {isSectionVisible(c, "director") ? (
          <DirectorMessage content={c.director} />
        ) : null}
        {/* Vision/mission/objectives and the milestones carousel live on
            /about (and the nav points there), so the home page no longer
            repeats them. */}
        {isSectionVisible(c, "services") ? <ServicesSection content={c.services} lang={lang} /> : null}
        {isSectionVisible(c, "structure") ? (
          <StructureSection content={c.structure} />
        ) : null}
        {isSectionVisible(c, "team") ? <TeamSection content={c.team} /> : null}
        {isSectionVisible(c, "banner") ? <CampusBanner content={c.banner} /> : null}
        {isSectionVisible(c, "events") ? <EventsSection content={c.events} /> : null}
        {isSectionVisible(c, "gallery") ? (
          <GallerySection content={c.gallery} lightbox={c.pages.gallery.lightbox} lang={lang} />
        ) : null}
        {isSectionVisible(c, "faq") ? <FaqSection content={c.faq} /> : null}
        {isSectionVisible(c, "cta") ? <CtaSection content={c.cta} /> : null}
        {isSectionVisible(c, "news") ? <NewsSection content={c.news} /> : null}
        {isSectionVisible(c, "newsletter") ? <NewsletterSection content={c.newsletter} /> : null}
        <Blocks blocks={c.homeBlocks?.beforeFooter} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
