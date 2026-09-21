import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";
import type { Locale } from "@/i18n/config";
import type { NewsPost, SiteContent } from "@/types/content";

/**
 * A single news item. Three-level breadcrumb, meta row, title and lead, then
 * the 16:9 photo above a measure-limited body. Closes with a link back to the
 * listing and the other items.
 */
export default function NewsArticle({
  lang,
  post,
  related,
  content,
}: {
  lang: Locale;
  post: NewsPost;
  related: NewsPost[];
  content: SiteContent;
}) {
  const { common, pages } = content;

  return (
    <article className="mx-auto w-full max-w-[1520px] px-5 pb-14 pt-22 xl:px-25 xl:pb-[140px] xl:pt-[156px]">
      <nav aria-label={common.breadcrumb}>
        <ol className="flex list-none flex-wrap items-center gap-2 p-0">
          <li>
            <Link
              href={`/${lang}`}
              className="t-body transition-colors duration-200 hover:text-navy"
            >
              {common.home}
            </Link>
          </li>
          <li aria-hidden className="t-body select-none">
            /
          </li>
          <li>
            <Link
              href={`/${lang}/news`}
              className="t-body transition-colors duration-200 hover:text-navy"
            >
              {pages.news.label}
            </Link>
          </li>
          <li aria-hidden className="t-body select-none">
            /
          </li>
          <li aria-current="page" className="t-body text-navy">
            {post.title}
          </li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy">
          {post.date}
        </p>
        <p className="t-body">{post.author}</p>
      </div>

      <h1 className="t-h1 mt-4 xl:max-w-[980px]">{post.title}</h1>
      <p className="t-body-lg mt-5 xl:max-w-[720px]">{post.excerpt}</p>

      <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden xl:mt-14">
        <Image
          src={post.image}
          alt={post.imageAlt}
          fill
          priority
          sizes="(max-width: 1199px) 100vw, 1320px"
          className="object-cover"
        />
      </div>

      <div className="mt-8 flex flex-col gap-6 xl:mt-14 xl:max-w-[760px]">
        {post.body.map((paragraph) => (
          <p key={paragraph} className="t-body-lg">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-8 h-px w-full bg-navy xl:mt-16" />
      <Link
        href={`/${lang}/news`}
        className="group mt-6 inline-flex items-center gap-2.5 font-[family-name:var(--font-heading)] text-[16px] font-bold leading-6 text-navy"
      >
        <ArrowUpRightIcon className="shrink-0 -scale-x-100 transition-transform duration-200 group-hover:-translate-x-0.5 rtl:scale-x-100 rtl:group-hover:translate-x-0.5" />
        {pages.newsDetail.back}
      </Link>

      {related.length ? (
        <section className="mt-12 xl:mt-25">
          <h2 className="t-h4">{pages.newsDetail.related}</h2>
          <ul className="mt-8 grid list-none grid-cols-1 gap-8 p-0 xl:grid-cols-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  className="group flex flex-col items-start gap-5"
                >
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
                    <div className="flex w-full items-start justify-between gap-4">
                      <p className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy">
                        {item.date}
                      </p>
                      <p className="t-body text-end">{item.author}</p>
                    </div>
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
