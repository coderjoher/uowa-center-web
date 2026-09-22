/**
 * Sections that are built, translated and kept in the codebase but not shown
 * right now. Flip one back to `true` to restore it — the pages render it again
 * and its site-map entries come back with it; nothing else needs editing.
 */
export const VISIBLE_SECTIONS = {
  director: true,
  structure: false,
  team: false,
} as const;

export type HideableSection = keyof typeof VISIBLE_SECTIONS;

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
