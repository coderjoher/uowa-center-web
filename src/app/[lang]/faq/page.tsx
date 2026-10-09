import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/ui/PageHero";
import FaqSection from "@/components/FaqSection";
import CtaSection from "@/components/CtaSection";
import { getContent } from "@/data";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/faq">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = (await getContent(lang)).pages.faq;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/${lang}/faq` },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/faq">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = await getContent(lang);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <PageHero lang={lang} page={c.pages.faq} common={c.common} />
        <FaqSection content={c.faq} />
        <CtaSection content={c.cta} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
