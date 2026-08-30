"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/ui/Logo";
import { ChevronDownIcon, MenuBulletIcon } from "@/components/icons";
import { SWITCH_TO, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/**
 * Fixed translucent navbar: `rgba(255,255,255,.15)` + `backdrop-filter: blur(12px)`.
 *
 * Desktop (>=1200px): 80px tall, links gap 40px, then the language switch and
 * the underlined "Contact" button.
 *
 * Below 1200px the bar collapses to 68px with a 44x44 two-bar hamburger inset
 * 20px from the inline end. Opening it turns the bar navy, flips the logo and
 * bars light, converges the bars into an X and drops the site map down.
 *
 * Every inline offset uses logical properties so the whole bar mirrors under
 * `dir="rtl"` without a second set of rules.
 */
export default function SiteHeader({
  lang,
  content,
}: {
  lang: Locale;
  content: SiteContent;
}) {
  const [open, setOpen] = useState(false);
  const { nav, brand } = content;
  const other = SWITCH_TO[lang];

  return (
    <div className="fixed inset-x-0 top-0 z-30">
      <nav
        className={`w-full backdrop-blur-[12px] transition-colors duration-300 xl:h-20 ${
          open ? "bg-navy pb-30" : "bg-white/15"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-8 px-5 xl:flex-row xl:items-center xl:justify-between xl:gap-0 xl:px-25">
          {/* Bar */}
          <div
            className={`flex h-[68px] items-center justify-between py-3 xl:h-20 xl:py-0 ${
              open ? "border-b-[0.5px] border-surface" : ""
            }`}
          >
            <Logo lang={lang} brand={brand} tone={open ? "white" : "navy"} />

            {/* Hamburger — 44x44, two 20x2 bars inset 12px from the inline start */}
            <button
              type="button"
              aria-label={open ? nav.closeMenu : nav.openMenu}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="relative h-11 w-11 shrink-0 cursor-pointer xl:hidden"
            >
              <span
                className={`absolute start-3 h-0.5 w-5 rounded-[10px] transition-all duration-300 ${
                  open ? "top-[21px] rotate-45 bg-surface" : "top-4 bg-navy"
                }`}
              />
              <span
                className={`absolute start-3 h-0.5 w-5 rounded-[10px] transition-all duration-300 ${
                  open ? "top-[21px] -rotate-45 bg-surface" : "top-[27px] bg-navy"
                }`}
              />
            </button>
          </div>

          {/* Mobile menu — the site map, top-level gap 12, nested gap 16 */}
          {open ? (
            <ul className="flex w-[240px] list-none flex-col gap-3 p-0 xl:hidden">
              {nav.menu.map((item) => (
                <li key={item.label} className="flex flex-col gap-3">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`font-[family-name:var(--font-sans)] text-[15px] leading-[23px] transition-opacity duration-200 hover:opacity-80 ${
                      item.current ? "text-pale" : "text-white"
                    }`}
                  >
                    {item.label}
                  </Link>

                  {item.children ? (
                    <ul className="flex list-none flex-col gap-4 p-0 ps-2.5">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-4 font-[family-name:var(--font-sans)] text-[15px] leading-[23px] text-surface transition-opacity duration-200 hover:opacity-80"
                          >
                            <MenuBulletIcon className="shrink-0 text-white" />
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}

              <li className="mt-3">
                <Link
                  href={`/${other.locale}`}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center border border-surface px-4 py-1.5 font-[family-name:var(--font-sans)] text-[15px] leading-[23px] text-surface transition-opacity duration-200 hover:opacity-80"
                >
                  {other.label}
                </Link>
              </li>
            </ul>
          ) : null}

          {/* Desktop links */}
          <div className="hidden items-center gap-10 xl:flex">
            {nav.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex items-center gap-1.5 font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy transition-opacity duration-200 hover:opacity-70"
              >
                {link.label}
                {link.hasDropdown ? (
                  <ChevronDownIcon className="text-[#aaa]" />
                ) : null}
              </Link>
            ))}

            <Link
              href={`/${other.locale}`}
              hrefLang={other.locale}
              className="inline-flex h-9 items-center border border-navy px-3 font-[family-name:var(--font-sans)] text-[15px] leading-[26px] text-navy transition-opacity duration-200 hover:opacity-70"
            >
              {other.label}
            </Link>

            <Link
              href={`/${lang}#contact`}
              className="flex h-9 items-center justify-center border-b-[1.6px] border-navy px-5 pb-3 font-[family-name:var(--font-heading)] text-[16px] font-bold leading-6 text-navy transition-opacity duration-200 hover:opacity-70"
            >
              {nav.contact}
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
