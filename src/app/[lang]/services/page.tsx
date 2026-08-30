import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/ui/PageHero";
import ServicesList from "@/components/ServicesList";
import CtaSection from "@/components/CtaSection";
import { getContent } from "@/data";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/services">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = getContent(lang).pages.services;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/${lang}/services` },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/services">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = getContent(lang);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <PageHero lang={lang} page={c.pages.services} common={c.common} />
        <ServicesList content={c.services} />
        <CtaSection content={c.cta} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
