import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";
import ar from "../../public/content/ar.json";
import en from "../../public/content/en.json";

/**
 * All copy lives in `public/content/{ar,en}.json`, one `SiteContent` object
 * per locale. The files sit under `public/` so the admin at `/admin` can
 * fetch them as well as commit new versions through the GitHub API; the
 * pages import them here and bake them in at build time. The JSON is typed
 * by assertion — its shape is what the admin writes, and a build fails
 * loudly if a required key is missing.
 */
export const CONTENT: Record<Locale, SiteContent> = {
  ar: ar as unknown as SiteContent,
  en: en as unknown as SiteContent,
};

export function getContent(locale: Locale): SiteContent {
  return CONTENT[locale];
}
