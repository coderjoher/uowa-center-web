import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NewsArticle from "@/components/NewsArticle";
import { CONTENT, getContent } from "@/data";
import { LOCALES, isLocale } from "@/i18n/config";

/** One page per article per locale. */
export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    CONTENT[lang].news.items.map((post) => ({ lang, slug: post.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/news/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const c = getContent(lang);
  const post = c.news.items.find((item) => item.slug === slug);
  if (!post) return {};

  return {
    title: `${post.title} | ${c.brand.name} ${c.brand.suffix}`,
    description: post.excerpt,
    alternates: { canonical: `/${lang}/news/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      images: [post.image],
    },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/news/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const c = getContent(lang);
  const post = c.news.items.find((item) => item.slug === slug);
  if (!post) notFound();

  const related = c.news.items.filter((item) => item.slug !== slug);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <NewsArticle lang={lang} post={post} related={related} content={c} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
