import Link from "next/link";
import Logo from "@/components/ui/Logo";
import type { Locale } from "@/i18n/config";
import type { NavLink, SiteContent } from "@/types/content";

/**
 * Navy footer, 586px tall: padding 80px 0 40px, flex column, gap 100.
 * Row 1 (340 tall): a 415-wide brand block (wordmark + tagline over a 302x168
 * dash ornament) and a 735-wide group of three link columns.
 * Row 2: centred copyright.
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
    <footer className="flex flex-col items-center gap-10 bg-navy pb-10 pt-10 xl:gap-25 xl:pt-20">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col items-start justify-between gap-[60px] px-5 xl:h-[340px] xl:flex-row xl:px-25">
        {/* Brand block */}
        <div className="flex w-full max-w-[415px] flex-col items-start justify-between xl:h-full">
          <div className="flex flex-col items-start gap-4.5">
            <Logo lang={lang} brand={brand} tone="white" />
            <p className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-white">
              {footer.tagline}
            </p>
          </div>

          <div
            aria-hidden
            className="ornament-flip pointer-events-none mt-13 hidden h-[168px] w-[302px] xl:block"
            style={{ backgroundImage: "url(/svg/ornament-footer.svg)" }}
          />
        </div>

        {/* Link columns */}
        <div className="flex w-full flex-col items-start justify-between gap-[33px] xl:w-[735px] xl:flex-row xl:gap-12">
          {footer.columns.map((column) => (
            <FooterColumn
              key={column.title}
              title={column.title}
              links={column.links}
            />
          ))}

          <div className="flex flex-col items-start gap-[33px] xl:gap-12">
            <div className="flex flex-col items-start gap-8">
              <h4 className="t-h4 text-white">{footer.addressTitle}</h4>
              <div className="flex max-w-[234px] flex-col items-start gap-[18px] xl:gap-6">
                <p className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-[#ccdce6]">
                  {footer.address}
                </p>
                <a
                  href={footer.phoneHref}
                  dir="ltr"
                  className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-[#ccdce6] transition-colors duration-200 hover:text-white"
                >
                  {footer.phone}
                </a>
                <a
                  href={`mailto:${footer.email}`}
                  dir="ltr"
                  className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-[#ccdce6] transition-colors duration-200 hover:text-white"
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
                  className="flex h-12 min-w-12 items-center justify-center border-[0.5px] border-white bg-navy px-2 font-[family-name:var(--font-sans)] text-[16px] font-bold leading-[26px] text-white transition-opacity duration-200 hover:opacity-70"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1520px] items-center justify-center px-5 xl:px-25">
        <p className="text-center font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-[#ccdce6]">
          {footer.copyright}
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div className="flex flex-col items-start gap-8">
      <h4 className="t-h4 text-white">{title}</h4>
      <div className="flex flex-col items-start gap-[21px] xl:gap-6">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-[#ccdce6] transition-colors duration-200 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
