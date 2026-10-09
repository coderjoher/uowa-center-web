import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/ui/PageHero";
import PlanTable from "@/components/PlanTable";
import CtaSection from "@/components/CtaSection";
import { getContent } from "@/data";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[lang]/plan">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = (await getContent(lang)).pages.plan;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/${lang}/plan` },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/plan">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = await getContent(lang);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <PageHero lang={lang} page={c.pages.plan} common={c.common} />
        <PlanTable content={c.plan} />
        <CtaSection content={c.cta} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
