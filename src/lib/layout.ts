import type { Block, LayoutItem, SectionKey, SiteContent } from "@/types/content";

/** The built-in sections, with their names in the admin. */
export const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "hero", label: "الواجهة الرئيسية" },
  { key: "about", label: "عن المركز" },
  { key: "features", label: "المزايا" },
  { key: "video", label: "قسم الفيديو" },
  { key: "director", label: "كلمة المدير" },
  { key: "overview", label: "الرؤية والرسالة" },
  { key: "services", label: "الخدمات" },
  { key: "structure", label: "الهيكلية" },
  { key: "team", label: "فريق المركز" },
  { key: "banner", label: "شريط الفيديو" },
  { key: "events", label: "الدورات والورش" },
  { key: "plan", label: "الخطة السنوية" },
  { key: "gallery", label: "معرض الصور" },
  { key: "milestones", label: "محطات المركز" },
  { key: "faq", label: "الأسئلة الشائعة" },
  { key: "cta", label: "دعوة التواصل" },
  { key: "news", label: "الأخبار" },
  { key: "newsletter", label: "النشرة البريدية" },
];

export const isSectionKey = (key: unknown): key is SectionKey => SECTIONS.some((s) => s.key === key);

/** The home page as it was before the page builder: same order, same hidden sections, same added blocks. */
const CLASSIC_HOME: SectionKey[] = [
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
];

export function defaultHomeLayout(c: Pick<SiteContent, "homeBlocks" | "sections">): LayoutItem[] {
  const hidden = (key: SectionKey) => (c.sections as Record<string, boolean> | undefined)?.[key] === false;
  const blocks = (list: Block[] | undefined): LayoutItem[] => (list ?? []).map((b) => ({ ...b }));
  return [
    { type: "section", section: "hero" },
    ...blocks(c.homeBlocks?.afterHero),
    ...CLASSIC_HOME.map((key) => ({ type: "section" as const, section: key, ...(hidden(key) ? { hidden: true } : {}) })),
    ...blocks(c.homeBlocks?.beforeFooter),
  ];
}
