import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";
import type { HideableSection } from "@/config/sections";
import ar from "../../public/content/ar.json";
import en from "../../public/content/en.json";
import settings from "../../public/content/settings.json";

/**
 * Where the site's content comes from.
 *
 * With `STRAPI_URL` set, every page reads its locale's content from the
 * Strapi CMS (`GET /api/site-content?locale=…`, see cms/src/api/site-content).
 * The request is cached under the `strapi` tag: Strapi's publish webhook
 * calls /api/revalidate, which clears that tag, so an edit shows on the
 * next visit; failing that, the cache refreshes on its own every hour.
 *
 * The JSON files in public/content are the bundled copy. They are used
 * when no CMS is configured, when the CMS cannot be reached (the error is
 * logged and the site keeps working), and section by section for anything
 * not yet published in the CMS, since the CMS response is laid over them.
 *
 * Media paths the CMS returns (`/uploads/…`) are made absolute against
 * `STRAPI_PUBLIC_URL`, or `STRAPI_URL` when the CMS has a single address.
 */
export const BUNDLED: Record<Locale, SiteContent> = {
  ar: { ...(ar as unknown as SiteContent), sections: settings.sections as Record<HideableSection, boolean> },
  en: { ...(en as unknown as SiteContent), sections: settings.sections as Record<HideableSection, boolean> },
};

const CMS = process.env.STRAPI_URL?.replace(/\/+$/, "");
const MEDIA_ORIGIN = (process.env.STRAPI_PUBLIC_URL ?? process.env.STRAPI_URL)?.replace(/\/+$/, "");

function absolutize<T>(value: T): T {
  if (typeof value === "string") {
    return (value.startsWith("/uploads/") && MEDIA_ORIGIN ? `${MEDIA_ORIGIN}${value}` : value) as T;
  }
  if (Array.isArray(value)) return value.map(absolutize) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = absolutize(v);
    return out as T;
  }
  return value;
}

export async function getContent(locale: Locale): Promise<SiteContent> {
  const bundled = BUNDLED[locale];
  if (!CMS) return bundled;
  try {
    const res = await fetch(`${CMS}/api/site-content?locale=${locale}`, {
      cache: "force-cache",
      next: { revalidate: 3600, tags: ["strapi"] },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cms = absolutize((await res.json()) as Partial<SiteContent>);
    return {
      ...bundled,
      ...cms,
      sections: { ...bundled.sections, ...(cms.sections ?? {}) } as Record<HideableSection, boolean>,
    };
  } catch (error) {
    console.error(`[content] CMS unavailable for "${locale}", using the bundled copy:`, error);
    return bundled;
  }
}
