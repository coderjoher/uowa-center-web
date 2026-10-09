import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/ui/PageHero";
import Layout from "@/components/sections/Layout";
import { getContent } from "@/data";
import { LOCALES, isLocale } from "@/i18n/config";

/**
 * Pages editors create in the admin ("الصفحات"), at /<lang>/<slug>. The
 * site's own routes (about, news…) take precedence, and the admin refuses
 * those addresses. Pages created after a build render on their first visit.
 */
export async function generateStaticParams() {
  const perLocale = await Promise.all(
    LOCALES.map(async (lang) => ((await getContent(lang)).customPages ?? []).map((page) => ({ lang, slug: page.slug }))),
  );
  return perLocale.flat();
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const c = await getContent(lang);
  const page = c.customPages?.find((p) => p.slug === slug);
  if (!page) return {};
  return {
    title: `${page.title} | ${c.brand.name} ${c.brand.suffix}`,
    description: page.intro,
    alternates: { canonical: `/${lang}/${slug}` },
    openGraph: page.image ? { images: [page.image] } : undefined,
  };
}

export default async function Page({ params }: PageProps<"/[lang]/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const c = await getContent(lang);
  const page = c.customPages?.find((p) => p.slug === slug);
  if (!page) notFound();

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <PageHero
          lang={lang}
          page={{ label: page.title, title: page.title, intro: page.intro, metaTitle: page.title, metaDescription: page.intro }}
          common={c.common}
        />
        {page.image ? (
          <div className="mx-auto w-full max-w-[1520px] px-5 xl:px-25">
            <div className="relative aspect-[16/6] w-full overflow-hidden bg-surface">
              <Image src={page.image} alt="" fill priority sizes="(max-width: 1520px) 100vw, 1320px" className="object-cover" />
            </div>
          </div>
        ) : null}
        <Layout items={page.blocks} c={c} lang={lang} at={`customPages.${c.customPages?.indexOf(page)}.blocks`} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
