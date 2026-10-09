import type { SiteContent } from "@/types/content";

/**
 * Sections that are built and translated but can be switched off. The
 * switches live in the CMS (the "إعدادات الأقسام" settings type) and arrive
 * with the rest of the content as `sections`; the bundled copy reads them
 * from public/content/settings.json. A hidden section leaves the pages and
 * its site-map entries go with it.
 */
export type HideableSection = "director" | "structure" | "team" | "video";

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
