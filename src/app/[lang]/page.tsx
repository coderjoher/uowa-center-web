import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import FeatureCards from "@/components/FeatureCards";
import DirectorMessage from "@/components/DirectorMessage";
import OverviewSection from "@/components/OverviewSection";
import ServicesSection from "@/components/ServicesSection";
import StructureSection from "@/components/StructureSection";
import TeamSection from "@/components/TeamSection";
import CampusBanner from "@/components/CampusBanner";
import EventsSection from "@/components/EventsSection";
import GallerySection from "@/components/GallerySection";
import MilestonesSection from "@/components/MilestonesSection";
import FaqSection from "@/components/FaqSection";
import CtaSection from "@/components/CtaSection";
import NewsSection from "@/components/NewsSection";
import NewsletterSection from "@/components/NewsletterSection";
import SiteFooter from "@/components/SiteFooter";
import { getContent } from "@/data";
import { isLocale } from "@/i18n/config";
import { isSectionVisible } from "@/config/sections";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const c = getContent(lang);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <Hero content={c.hero} />
        <AboutSection content={c.about} />
        <FeatureCards features={c.features} />
        {isSectionVisible("director") ? (
          <DirectorMessage content={c.director} />
        ) : null}
        <OverviewSection content={c.overview} />
        <ServicesSection content={c.services} />
        <StructureSection content={c.structure} />
        {isSectionVisible("team") ? <TeamSection content={c.team} /> : null}
        <CampusBanner content={c.banner} />
        <EventsSection content={c.events} />
        <GallerySection content={c.gallery} />
        <MilestonesSection content={c.milestones} lang={lang} />
        <FaqSection content={c.faq} />
        <CtaSection content={c.cta} />
        <NewsSection content={c.news} />
        <NewsletterSection content={c.newsletter} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
