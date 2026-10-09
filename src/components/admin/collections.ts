/**
 * The admin's collections (as in Strapi's collection types or Payload's
 * collections): the lists inside the content that are managed item by item,
 * each with a table, search, and an edit screen per item. Everything else
 * is a global (a single document such as the footer or a section's texts).
 *
 * `path` is where the list lives in each language's document; items line up
 * by position across the two languages, so creating, deleting and moving an
 * item applies to both.
 */
export interface CollectionDef {
  id: string;
  label: string;
  /** One item, for "new …" and the breadcrumbs. */
  singular: string;
  path: string[];
  /** Keys shown in the table: the title, a secondary column, and a thumbnail. */
  title: string;
  subtitle?: string;
  image?: string;
  /** Items have their own page, addressed by `slug`. */
  slug?: boolean;
  /** Where an item (or the list) shows on the site, for the live preview. */
  url: (locale: string, item: Record<string, unknown> | null) => string;
  group: "content" | "about" | "pages";
}

export const COLLECTIONS: CollectionDef[] = [
  {
    id: "news",
    label: "الأخبار",
    singular: "خبر",
    path: ["news", "items"],
    title: "title",
    subtitle: "date",
    image: "image",
    slug: true,
    url: (l, item) => (item?.slug ? `/${l}/news/${item.slug}` : `/${l}/news`),
    group: "content",
  },
  {
    id: "courses",
    label: "الدورات والورش",
    singular: "دورة",
    path: ["events", "items"],
    title: "title",
    subtitle: "date",
    image: "image",
    slug: true,
    url: (l, item) => (item?.slug ? `/${l}/courses/${item.slug}` : `/${l}/courses`),
    group: "content",
  },
  { id: "services", label: "الخدمات", singular: "خدمة", path: ["services", "items"], title: "title", image: "image", url: (l) => `/${l}/services`, group: "content" },
  { id: "faq", label: "الأسئلة الشائعة", singular: "سؤال", path: ["faq", "items"], title: "question", url: (l) => `/${l}/faq`, group: "content" },
  { id: "plan", label: "الخطة السنوية", singular: "نشاط", path: ["plan", "rows"], title: "activity", subtitle: "date", url: (l) => `/${l}/plan`, group: "content" },
  { id: "gallery", label: "صور صفحة المعرض", singular: "صورة", path: ["pages", "gallery", "photos"], title: "caption", image: "image", url: (l) => `/${l}/gallery`, group: "content" },
  { id: "homeGallery", label: "معرض الصور (الرئيسية)", singular: "صورة", path: ["gallery", "items"], title: "title", image: "image", url: (l) => `/${l}#gallery`, group: "content" },
  { id: "team", label: "فريق المركز", singular: "عضو", path: ["team", "members"], title: "name", subtitle: "role", image: "image", url: (l) => `/${l}/about#team`, group: "about" },
  { id: "structure", label: "شعب المركز", singular: "شعبة", path: ["structure", "divisions"], title: "title", url: (l) => `/${l}/about#structure`, group: "about" },
  { id: "milestones", label: "محطات المركز", singular: "محطة", path: ["milestones", "items"], title: "title", subtitle: "year", image: "image", url: (l) => `/${l}/about`, group: "about" },
  { id: "features", label: "المزايا", singular: "ميزة", path: ["features"], title: "title", url: (l) => `/${l}`, group: "about" },
  { id: "contactCards", label: "بطاقات التواصل", singular: "بطاقة", path: ["pages", "contact", "cards"], title: "title", url: (l) => `/${l}/contact`, group: "pages" },
];

export const collectionAt = (path: (string | number)[]) =>
  COLLECTIONS.find((c) => c.path.length === path.length && c.path.every((p, i) => p === path[i]));

/** Globals: the single documents, grouped as in the sidebar. */
export const GLOBAL_GROUPS: { label: string; keys: string[] }[] = [
  { label: "الهوية والقوائم", keys: ["brand", "nav", "footer", "meta", "common"] },
  {
    label: "نصوص الأقسام",
    keys: ["hero", "about", "video", "director", "overview", "services", "structure", "team", "banner", "events", "plan", "gallery", "milestones", "faq", "cta", "news", "newsletter"],
  },
  { label: "الصفحات الداخلية", keys: ["pages"] },
];

/** Where a global shows on the site, for the live preview. */
export function globalUrl(key: string, locale: string): string {
  if (["overview", "director", "team", "structure", "milestones", "pages"].includes(key)) return `/${locale}/about`;
  if (key === "plan") return `/${locale}/plan`;
  return `/${locale}`;
}
