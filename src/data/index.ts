import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";
import { AR } from "./ar";
import { EN } from "./en";

export const CONTENT: Record<Locale, SiteContent> = { ar: AR, en: EN };

export function getContent(locale: Locale): SiteContent {
  return CONTENT[locale];
}
