import { cache } from "react";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";
import type { HideableSection } from "@/config/sections";
import { databaseConfigured } from "@/cms/db";
import { readAllDocuments } from "@/cms/content";
import { markForPreview, previewer, readPreviewDocuments } from "@/cms/preview";
import { defaultHomeLayout } from "@/lib/layout";
import ar from "../../public/content/ar.json";
import en from "../../public/content/en.json";
import settings from "../../public/content/settings.json";

/**
 * Where the site's content comes from.
 *
 * With DATABASE_URL set, pages render from the content the editors manage
 * at /admin (see src/cms). Pages are cached as static HTML; every save in
 * the admin re-renders them, so a change shows on the next visit.
 *
 * In the admin's live preview (draft mode), pages render from the editor's
 * unsaved content instead, marked so clicks can be traced back to fields.
 *
 * The JSON files in public/content are the bundled copy. They are used when
 * no database is configured (a plain `npm run dev`, or a host without one),
 * when the database can't be reached (the error is logged and the site keeps
 * working), and they seed an empty database on first start.
 */
export const BUNDLED: Record<Locale, SiteContent> = {
  ar: { ...(ar as unknown as SiteContent), sections: settings.sections as Record<HideableSection, boolean> },
  en: { ...(en as unknown as SiteContent), sections: settings.sections as Record<HideableSection, boolean> },
};

/* One database read per render, however many components ask. */
const documents = cache(readAllDocuments);
const previewDocuments = cache(readPreviewDocuments);

/** Adds what older content lacks: the home page layout as it used to be. */
function complete(c: SiteContent): SiteContent {
  return c.homeLayout ? c : { ...c, homeLayout: defaultHomeLayout(c) };
}

export async function getContent(locale: Locale): Promise<SiteContent> {
  const bundled = BUNDLED[locale];
  if (!databaseConfigured()) return complete(bundled);
  try {
    /* In the admin's live preview, render the editor's unsaved content. */
    const editor = await previewer();
    const docs = editor ? await previewDocuments(editor.id) : await documents();
    const stored = docs[locale] as Partial<SiteContent>;
    const switches = (docs.settings as { sections?: Partial<Record<HideableSection, boolean>> }).sections;
    const content = complete({
      ...bundled,
      ...stored,
      sections: { ...bundled.sections, ...(switches ?? {}) } as Record<HideableSection, boolean>,
    });
    return editor ? markForPreview(content, locale) : content;
  } catch (error) {
    console.error(`[content] database unavailable for "${locale}", using the bundled copy:`, error);
    return complete(bundled);
  }
}
