import Link from "next/link";
import Logo from "@/components/ui/Logo";
import CircuitPattern from "@/components/ui/CircuitPattern";
import type { Locale } from "@/i18n/config";
import type { NavLink, SiteContent } from "@/types/content";

/**
 * Navy footer, 586px tall: padding 80px 0 40px, flex column, gap 100.
 * Row 1 (340 tall): a 415-wide brand block (wordmark + tagline over a 302x168
 * circuit ornament) and a 735-wide group of three link columns.
 * Row 2: centred copyright.
 *
 * Below 1200px the two link columns sit side by side in a two-column grid
 * with the address block spanning both underneath, and every gap and link
 * tightens, so the footer is about one screen instead of three.
 */
export default function SiteFooter({
  content,
  lang,
}: {
  content: SiteContent;
  lang: Locale;
}) {
  const { footer, brand } = content;

  return (
    <footer className="flex flex-col items-center gap-6 bg-navy pb-6 pt-10 xl:gap-25 xl:pb-8 xl:pt-20">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col items-start justify-between gap-8 px-5 xl:h-[340px] xl:flex-row xl:px-25">
        {/* Brand block */}
        <div className="flex w-full max-w-[415px] flex-col items-start justify-between xl:h-full">
          <div className="flex flex-col items-start gap-3 xl:gap-4.5">
            <Logo lang={lang} brand={brand} tone="white" />
            <p className="font-[family-name:var(--font-sans)] text-[15px] leading-6 text-white xl:text-[16px] xl:leading-[26px]">
              {footer.tagline}
            </p>
          </div>

          <CircuitPattern className="mt-10 hidden h-[170px] w-[300px] xl:block" />
        </div>

        {/* Link columns: a 2-up grid on phones, a spaced row from 1200px */}
        <div className="grid w-full grid-cols-2 gap-x-5 gap-y-8 xl:flex xl:w-[735px] xl:flex-row xl:items-start xl:justify-between xl:gap-12">
          {footer.columns.map((column) => (
            <FooterColumn
              key={column.title}
              title={column.title}
              links={column.links}
            />
          ))}

          <div className="col-span-2 flex flex-col items-start gap-5 xl:col-auto xl:gap-12">
            <div className="flex flex-col items-start gap-4 xl:gap-8">
              <h4 className="t-h4 text-white">{footer.addressTitle}</h4>
              <div className="flex flex-col items-start gap-2 xl:max-w-[234px] xl:gap-6">
                <p className="font-[family-name:var(--font-sans)] text-[15px] leading-6 text-[#ccdce6] xl:text-[16px] xl:leading-[26px]">
                  {footer.address}
                </p>
                <a
                  href={footer.phoneHref}
                  dir="ltr"
                  className="font-[family-name:var(--font-sans)] text-[15px] leading-6 text-[#ccdce6] transition-colors duration-200 hover:text-white xl:text-[16px] xl:leading-[26px]"
                >
                  {footer.phone}
                </a>
                <a
                  href={`mailto:${footer.email}`}
                  dir="ltr"
                  className="font-[family-name:var(--font-sans)] text-[15px] leading-6 text-[#ccdce6] transition-colors duration-200 hover:text-white xl:text-[16px] xl:leading-[26px]"
                >
                  {footer.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {footer.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  title={social.title}
                  aria-label={social.title}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 min-w-11 items-center justify-center border-[0.5px] border-white bg-navy px-2 font-[family-name:var(--font-sans)] text-[15px] font-bold leading-6 text-white transition-colors duration-200 hover:border-gold hover:text-gold xl:h-12 xl:min-w-12 xl:text-[16px] xl:leading-[26px]"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1520px] items-center justify-center border-t border-white/10 px-5 pt-5 xl:border-0 xl:pt-0 xl:px-25">
        <p className="text-center font-[family-name:var(--font-sans)] text-[13px] leading-5 text-[#ccdce6] xl:text-[16px] xl:leading-[26px]">
          {footer.copyright}
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-4 xl:gap-8">
      <h4 className="t-h4 text-white">{title}</h4>
      <div className="flex flex-col items-start gap-2.5 xl:gap-6">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="font-[family-name:var(--font-sans)] text-[15px] leading-6 text-[#ccdce6] transition-colors duration-200 hover:text-white xl:text-[16px] xl:leading-[26px]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
