import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CourseArticle from "@/components/CourseArticle";
import { CONTENT, getContent } from "@/data";
import { LOCALES, isLocale } from "@/i18n/config";

/** One page per course per locale. */
export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    CONTENT[lang].events.items.map((course) => ({ lang, slug: course.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/courses/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const c = getContent(lang);
  const course = c.events.items.find((item) => item.slug === slug);
  if (!course) return {};

  return {
    title: `${course.title} | ${c.brand.name} ${c.brand.suffix}`,
    description: course.excerpt,
    alternates: { canonical: `/${lang}/courses/${slug}` },
    openGraph: {
      type: "article",
      title: course.title,
      description: course.excerpt,
      images: [course.image],
    },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/courses/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const c = getContent(lang);
  const course = c.events.items.find((item) => item.slug === slug);
  if (!course) notFound();

  const related = c.events.items.filter((item) => item.slug !== slug);

  return (
    <>
      <SiteHeader lang={lang} content={c} />
      <main className="overflow-x-hidden">
        <CourseArticle lang={lang} course={course} related={related} content={c} />
      </main>
      <SiteFooter content={c} lang={lang} />
    </>
  );
}
