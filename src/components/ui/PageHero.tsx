import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PageMeta, SiteContent } from "@/types/content";

/**
 * Header for every secondary page: breadcrumb, h1, intro, closing rule.
 * The top padding clears the fixed navbar, matching the home page's hero.
 */
export default function PageHero({
  lang,
  page,
  common,
}: {
  lang: Locale;
  page: PageMeta;
  common: SiteContent["common"];
}) {
  return (
    <header className="mx-auto w-full max-w-[1520px] px-5 pb-8 pt-22 xl:px-25 xl:pb-20 xl:pt-[156px]">
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
          <li aria-current="page" className="t-body text-navy">
            {page.label}
          </li>
        </ol>
      </nav>

      <h1 className="t-h1 mt-4 xl:max-w-[900px]">{page.title}</h1>
      <p className="t-body-lg mt-5 xl:max-w-[680px]">{page.intro}</p>

      <div className="mt-8 h-px w-full bg-navy xl:mt-14" />
    </header>
  );
}
