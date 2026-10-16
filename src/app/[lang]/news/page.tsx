import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/ui/PageHero";
import NewsSection from "@/components/NewsSection";
import NewsletterSection from "@/components/NewsletterSection";
import { getContent } from "@/data";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/news">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = (await getContent(lang)).pages.news;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/${lang}/news` },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/news">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = await getContent(lang);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <PageHero lang={lang} page={c.pages.news} common={c.common} />
        <NewsSection content={c.news} archive />
        <NewsletterSection content={c.newsletter} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
