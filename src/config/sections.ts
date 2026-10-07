import settings from "../../public/content/settings.json";

/**
 * Sections that are built and translated but can be switched off. The flags
 * live in `public/content/settings.json` so the admin at `/admin` can flip
 * them; a hidden section leaves the pages and its site-map entries go with
 * it, nothing else needs editing.
 */
export type HideableSection = "director" | "structure" | "team" | "video";

export const VISIBLE_SECTIONS: Record<HideableSection, boolean> =
  settings.sections;

export function isSectionVisible(id: HideableSection): boolean {
  return VISIBLE_SECTIONS[id];
}

/**
 * True for a link whose target is a hidden section, so menus can drop it.
 * Hrefs without a hash, or with a hash we do not gate, are always kept.
 */
export function pointsAtHiddenSection(href: string): boolean {
  const hash = href.split("#")[1];
  if (!hash) return false;
  return hash in VISIBLE_SECTIONS && !VISIBLE_SECTIONS[hash as HideableSection];
}
