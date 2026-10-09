import type { SiteContent } from "@/types/content";

/**
 * Sections that can be switched off in the admin ("إظهار الأقسام"). The
 * switches arrive with the rest of the content as `sections`; the bundled
 * copy reads them from public/content/settings.json. Every home page section
 * can be hidden there; the director's word, structure, team and video also
 * leave the other pages, and menu links to a hidden section are dropped.
 */
export const HIDEABLE_SECTIONS = [
  "about",
  "features",
  "video",
  "director",
  "services",
  "structure",
  "team",
  "banner",
  "events",
  "gallery",
  "faq",
  "cta",
  "news",
  "newsletter",
] as const;
export type HideableSection = (typeof HIDEABLE_SECTIONS)[number];

export function isSectionVisible(content: Pick<SiteContent, "sections">, id: HideableSection): boolean {
  return content.sections?.[id] ?? true;
}

/**
 * True for a link whose target is a hidden section, so menus can drop it.
 * Hrefs without a hash, or with a hash we do not gate, are always kept.
 */
export function pointsAtHiddenSection(href: string, sections: SiteContent["sections"]): boolean {
  const hash = href.split("#")[1];
  if (!hash || !sections) return false;
  return hash in sections && sections[hash as HideableSection] === false;
}
