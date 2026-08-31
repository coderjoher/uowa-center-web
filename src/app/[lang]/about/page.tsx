import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/ui/PageHero";
import AboutSection from "@/components/AboutSection";
import DirectorMessage from "@/components/DirectorMessage";
import OverviewSection from "@/components/OverviewSection";
import StructureSection from "@/components/StructureSection";
import TeamSection from "@/components/TeamSection";
import MilestonesSection from "@/components/MilestonesSection";
import CtaSection from "@/components/CtaSection";
import { getContent } from "@/data";
import { isLocale } from "@/i18n/config";
import { isSectionVisible } from "@/config/sections";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = getContent(lang).pages.about;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/${lang}/about` },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = getContent(lang);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <PageHero lang={lang} page={c.pages.about} common={c.common} />
        <AboutSection content={c.about} />
        {isSectionVisible("director") ? (
          <DirectorMessage content={c.director} />
        ) : null}
        <OverviewSection content={c.overview} />
        {isSectionVisible("structure") ? (
          <StructureSection content={c.structure} />
        ) : null}
        {isSectionVisible("team") ? <TeamSection content={c.team} /> : null}
        <MilestonesSection content={c.milestones} lang={lang} />
        <CtaSection content={c.cta} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
