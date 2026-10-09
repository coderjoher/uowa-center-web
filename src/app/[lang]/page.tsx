import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Layout from "@/components/sections/Layout";
import { getContent } from "@/data";
import { isLocale } from "@/i18n/config";

/**
 * The home page, built from its layout in the page builder (the admin's
 * «الصفحات» → الرئيسية): the site's own sections and editors' blocks, in
 * the order and visibility set there.
 */
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const c = await getContent(lang);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <Layout items={c.homeLayout} c={c} lang={lang} at="homeLayout" />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
