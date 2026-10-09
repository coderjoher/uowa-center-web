import Image from "next/image";
import Link from "next/link";
import SolidButton from "@/components/ui/SolidButton";
import { ArrowUpRightIcon, CalendarIcon, PinIcon } from "@/components/icons";
import type { Locale } from "@/i18n/config";
import type { SiteContent, TrainingEvent } from "@/types/content";
import RichText from "@/components/ui/RichText";

/**
 * A single course. Breadcrumb, title and lead, photo, then a two-column body:
 * the write-up and outline on the wide side, the practical facts and the
 * registration CTA in a tinted panel beside it.
 */
export default function CourseArticle({
  lang,
  course,
  related,
  content,
}: {
  lang: Locale;
  course: TrainingEvent;
  related: TrainingEvent[];
  content: SiteContent;
}) {
  const { common, pages } = content;
  const t = pages.courseDetail;

  return (
    <article className="mx-auto w-full max-w-[1520px] px-5 pb-14 pt-22 xl:px-25 xl:pb-[140px] xl:pt-[156px]">
      <nav aria-label={common.breadcrumb}>
        <ol className="flex list-none flex-wrap items-center gap-2 p-0">
          <li>
            <Link href={`/${lang}`} className="t-body transition-colors duration-200 hover:text-navy">
              {common.home}
            </Link>
          </li>
          <li aria-hidden className="t-body select-none">/</li>
          <li>
            <Link href={`/${lang}/courses`} className="t-body transition-colors duration-200 hover:text-navy">
              {pages.courses.label}
            </Link>
          </li>
          <li aria-hidden className="t-body select-none">/</li>
          <li aria-current="page" className="t-body text-navy">
            {course.title}
          </li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="flex items-center gap-[9px]">
          <CalendarIcon className="shrink-0 text-gold" />
          <p className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy">
            {course.date}
          </p>
        </span>
        <span className="flex items-center gap-[9px]">
          <PinIcon className="shrink-0 text-gold" />
          <p className="t-body">{course.venue}</p>
        </span>
      </div>

      <h1 className="t-h1 mt-4 xl:max-w-[980px]">{course.title}</h1>
      <p className="t-body-lg mt-5 xl:max-w-[720px]">{course.excerpt}</p>

      <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden xl:mt-14">
        <Image
          src={course.image}
          alt={course.imageAlt}
          fill
          priority
          sizes="(max-width: 1199px) 100vw, 1320px"
          className="object-cover"
        />
      </div>

      <div className="mt-8 flex flex-col gap-8 xl:mt-14 xl:flex-row xl:items-start xl:gap-20">
        <div className="flex flex-col gap-6 xl:max-w-[760px]">
          <RichText value={course.body} className="t-body-lg" />

          <h2 className="t-h4 mt-4">{t.outline}</h2>
          <ul className="flex list-none flex-col gap-4 p-0">
            {course.outline.map((item) => (
              <li key={item} className="flex items-start gap-4">
                <span aria-hidden className="mt-3 h-0.5 w-4 shrink-0 bg-navy" />
                <p className="t-body">{item}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Practical facts */}
        <aside className="w-full bg-surface p-6 xl:w-[380px] xl:shrink-0 xl:p-10">
          <h2 className="t-h4">{t.details}</h2>
          <dl className="mt-6 flex flex-col gap-5">
            {course.details.map((detail) => (
              <div key={detail.label} className="flex flex-col gap-1 border-t border-border-soft pt-4">
                <dt className="t-body">{detail.label}</dt>
                <dd className="m-0 font-[family-name:var(--font-heading)] text-[16px] font-bold leading-6 text-navy">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
          <SolidButton href={`/${lang}/contact`} className="mt-8 w-full">
            {t.register}
          </SolidButton>
        </aside>
      </div>

      <div className="mt-8 h-px w-full bg-navy xl:mt-16" />
      <Link
        href={`/${lang}/courses`}
        className="group mt-6 inline-flex items-center gap-2.5 font-[family-name:var(--font-heading)] text-[16px] font-bold leading-6 text-navy"
      >
        <ArrowUpRightIcon className="shrink-0 -scale-x-100 transition-transform duration-200 group-hover:-translate-x-0.5 rtl:scale-x-100 rtl:group-hover:translate-x-0.5" />
        {t.back}
      </Link>

      {related.length ? (
        <section className="mt-12 xl:mt-25">
          <h2 className="t-h4">{t.related}</h2>
          <ul className="mt-8 grid list-none grid-cols-1 gap-8 p-0 xl:grid-cols-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={item.href} className="group flex flex-col items-start gap-5">
                  <div className="relative aspect-[382/240] w-full overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      sizes="(max-width: 1199px) 100vw, 620px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex w-full flex-col items-start gap-3.5">
                    <p className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy">
                      {item.date}
                    </p>
                    <div className="h-px w-full bg-navy" />
                    <h3 className="t-h4">{item.title}</h3>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
