"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type Lenis from "lenis";
import Logo from "@/components/ui/Logo";
import { ChevronDownIcon, MenuBulletIcon } from "@/components/icons";
import { SWITCH_TO, type Locale } from "@/i18n/config";
import { pointsAtHiddenSection } from "@/config/sections";
import type { NavLink, SiteContent } from "@/types/content";

/**
 * Fixed navbar. Solid white with a hairline under it, so it reads as its own
 * bar rather than dissolving into the hero beneath it.
 *
 * Desktop (>=1200px): 80px tall, links gap 40px, then the language switch and
 * the underlined "Contact" button.
 *
 * Below 1200px the bar collapses to 68px with a 44x44 two-bar hamburger inset
 * 20px from the inline end. Opening it turns the bar navy, flips the logo and
 * bars light, converges the bars into an X and reveals the site map as a navy
 * overlay that fills the rest of the screen. The overlay is always in the
 * tree so it can animate: it fades and settles down over 500ms and its links
 * rise in one after another; closing runs the same in reverse. Page scroll
 * (Lenis, or native under reduced motion) is stopped while it is open.
 *
 * Every inline offset uses logical properties so the whole bar mirrors under
 * `dir="rtl"` without a second set of rules.
 */
const MAX_VISIBLE = 5;

/**
 * One desktop nav title. With sub-pages it opens a dropdown panel on hover
 * or keyboard focus (pure CSS: `group-hover` / `group-focus-within`); the
 * title itself still links to its page. Sub-pages pointing at a hidden
 * section are dropped. The "more" menu is the same control with the
 * overflow titles as its items and no link of its own.
 */
function DesktopLink({
  link,
  current,
  sections,
  isMore = false,
}: {
  link: NavLink;
  current: boolean;
  sections: SiteContent["sections"];
  isMore?: boolean;
}) {
  const children = (link.children ?? []).filter((c) => !pointsAtHiddenSection(c.href, sections));
  const label = (
    <>
      {link.label}
      {children.length ? (
        <ChevronDownIcon className="text-[#aaa] transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
      ) : null}
    </>
  );
  const cls = `inline-flex items-center gap-1.5 border-b font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy transition-colors duration-200 ${
    current ? "border-gold" : "border-transparent hover:border-gold"
  }`;

  if (!children.length) {
    return (
      <Link href={link.href} aria-current={current ? "page" : undefined} className={cls}>
        {label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      {isMore ? (
        <button type="button" aria-haspopup="true" className={`${cls} cursor-pointer`}>
          {label}
        </button>
      ) : (
        <Link href={link.href} aria-current={current ? "page" : undefined} aria-haspopup="true" className={cls}>
          {label}
        </Link>
      )}
      {/* The padding bridges the gap so the pointer can travel into the panel. */}
      <div className="invisible absolute start-1/2 top-full z-40 -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility,transform] duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 rtl:translate-x-1/2">
        <ul className="min-w-[240px] list-none border-t-2 border-gold bg-white p-2 shadow-[0_18px_40px_-20px_rgb(21_40_61/0.45)]">
          {children.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className="block whitespace-nowrap px-3 py-2.5 font-[family-name:var(--font-sans)] text-[15px] leading-6 text-navy transition-colors duration-150 hover:bg-surface"
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

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
  const pathname = usePathname();

  /** Marks the live page. Menu hrefs may carry a hash; the route is what counts. */
  const isCurrent = (href: string) => pathname === href.split("#")[0];

  /* The bar fits five titles beside the switcher and the contact link at
     1200px; anything past that folds into the "more" menu, so editors can
     add titles from the admin without breaking the row. */
  const visibleLinks = nav.links.slice(0, MAX_VISIBLE);
  const overflowLinks = nav.links.slice(MAX_VISIBLE);

  /* Every link closes the menu on click; Escape closes it too. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* Freeze the page behind the overlay. Lenis owns scrolling when it is
     running (its `lenis-stopped` class sets overflow hidden); under reduced
     motion there is no Lenis and the html element is locked directly. */
  useEffect(() => {
    if (!open) return;
    const lenis = (window as unknown as { lenis?: Lenis }).lenis;
    const html = document.documentElement;
    if (lenis) lenis.stop();
    else html.style.overflow = "hidden";
    return () => {
      if (lenis) lenis.start();
      else html.style.overflow = "";
    };
  }, [open]);

  const ease = "ease-[cubic-bezier(0.16,1,0.3,1)]";
  /** Stagger for the overlay's rows: in on open, all at once on close. */
  const rowStyle = (i: number) => ({
    transitionDelay: open ? `${80 + i * 45}ms` : "0ms",
  });
  const rowClass = `transition-[opacity,transform] duration-500 ${ease} motion-reduce:transition-none ${
    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
  }`;

  return (
    <div className="fixed inset-x-0 top-0 z-30">
      <nav
        className={`relative z-10 w-full border-b transition-colors duration-300 xl:h-20 ${
          open ? "border-navy bg-navy" : "border-border-soft bg-white"
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
              aria-controls="site-menu"
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

          {/* Desktop links */}
          {/* Six links plus the switcher and CTA just touch the logo at
              1200px on the 40px design gap, so it tightens to 28 until there
              is room for the original spacing again. */}
          <div className="hidden items-center gap-6 xl:flex 2xl:gap-9">
            {visibleLinks.map((link) => (
              <DesktopLink key={link.href} link={link} current={isCurrent(link.href)} sections={content.sections} />
            ))}
            {overflowLinks.length ? (
              <DesktopLink
                link={{ label: nav.more, href: overflowLinks[0].href, children: overflowLinks }}
                current={overflowLinks.some((l) => isCurrent(l.href))}
                sections={content.sections}
                isMore
              />
            ) : null}

            <Link
              href={`/${other.locale}`}
              hrefLang={other.locale}
              className="inline-flex h-9 items-center border border-navy px-3 font-[family-name:var(--font-sans)] text-[15px] leading-[26px] text-navy transition-opacity duration-200 hover:opacity-70"
            >
              {other.label}
            </Link>

            <Link
              href={`/${lang}#contact`}
              className="flex h-9 items-center justify-center border-b-[1.6px] border-gold px-5 pb-3 font-[family-name:var(--font-heading)] text-[16px] font-bold leading-6 text-navy transition-opacity duration-200 hover:opacity-70"
            >
              {nav.contact}
            </Link>
          </div>
        </div>
      </nav>

      {/* Phone overlay — the site map under the bar, filling the screen */}
      <div
        id="site-menu"
        aria-hidden={!open}
        inert={!open}
        data-lenis-prevent
        className={`absolute inset-x-0 top-full h-[calc(100dvh-68px)] overflow-y-auto bg-navy transition-[opacity,transform,visibility] duration-500 ${ease} motion-reduce:transition-none xl:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <ul className="mx-auto flex w-full max-w-[1520px] list-none flex-col gap-1 px-5 pb-12 pt-4">
          {nav.menu.map((item, i) => (
            <li key={item.label} className={rowClass} style={rowStyle(i)}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={`flex min-h-12 items-center border-b border-white/10 py-2.5 font-[family-name:var(--font-sans)] text-[17px] leading-7 transition-opacity duration-200 hover:opacity-80 ${
                  isCurrent(item.href) ? "text-gold" : "text-white"
                }`}
              >
                {item.label}
              </Link>

              {item.children?.length ? (
                <ul className="flex list-none flex-col p-0 ps-2.5">
                  {item.children
                    .filter((child) => !pointsAtHiddenSection(child.href, content.sections))
                    .map((child) => (
                      <li key={child.label}>
                        <Link
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="flex min-h-11 items-center gap-4 py-2 font-[family-name:var(--font-sans)] text-[15px] leading-[23px] text-surface transition-opacity duration-200 hover:opacity-80"
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

          <li
            className={`mt-6 flex items-center gap-4 ${rowClass}`}
            style={rowStyle(nav.menu.length)}
          >
            <Link
              href={`/${lang}#contact`}
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center bg-gold px-6 font-[family-name:var(--font-heading)] text-[15px] font-bold leading-6 text-navy transition-opacity duration-200 hover:opacity-90"
            >
              {nav.contact}
            </Link>
            <Link
              href={`/${other.locale}`}
              hrefLang={other.locale}
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center border border-surface px-4 font-[family-name:var(--font-sans)] text-[15px] leading-[23px] text-surface transition-opacity duration-200 hover:opacity-80"
            >
              {other.label}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
