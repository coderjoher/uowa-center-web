import type { Block } from "@/types/content";

/**
 * The display types editors can choose for a block, with their Arabic names
 * for the admin and a blank block of each type to start from.
 */
export const BLOCK_TYPES: { type: Block["type"]; label: string; hint: string; blank: () => Block }[] = [
  {
    type: "text",
    label: "نص منسق",
    hint: "عنوان وفقرات بتنسيق (عريض، قوائم، محاذاة…)",
    blank: () => ({ type: "text", title: "", content: "" }),
  },
  {
    type: "cards",
    label: "بطاقات",
    hint: "شبكة بطاقات بصورة وعنوان ونص ورابط، مثل الإجراءات السريعة",
    blank: () => ({ type: "cards", title: "", intro: "", items: [{ title: "", text: "", image: "", href: "" }] }),
  },
  {
    type: "links",
    label: "روابط وملفات",
    hint: "قائمة أدلة وسياسات وتقارير، لكل منها ملف أو رابط",
    blank: () => ({ type: "links", title: "", intro: "", items: [{ title: "", description: "", href: "", file: "" }] }),
  },
  {
    type: "accordion",
    label: "أسئلة وأجوبة",
    hint: "عناصر قابلة للطي: سؤال وجوابه",
    blank: () => ({ type: "accordion", title: "", items: [{ question: "", answer: "" }] }),
  },
  {
    type: "stats",
    label: "أرقام وإحصاءات",
    hint: "أرقام كبيرة مع تسمياتها",
    blank: () => ({ type: "stats", title: "", items: [{ value: "", label: "" }] }),
  },
  {
    type: "announcements",
    label: "إعلانات وتنويهات",
    hint: "إعلانات مؤرخة بوسم (إعلان، تنويه…)",
    blank: () => ({ type: "announcements", title: "", items: [{ badge: "", date: "", title: "", text: "" }] }),
  },
  {
    type: "cta",
    label: "دعوة لإجراء",
    hint: "شريط بعنوان ونص وزر، مثل «قدّم الآن»",
    blank: () => ({ type: "cta", title: "", content: "", button: "", href: "", image: "" }),
  },
  {
    type: "image",
    label: "صورة",
    hint: "صورة عريضة مع تعليق",
    blank: () => ({ type: "image", image: "", caption: "" }),
  },
];

export const blockLabel = (type: string) => BLOCK_TYPES.find((b) => b.type === type)?.label ?? type;

/** Page addresses that belong to the site's own routes. */
export const RESERVED_SLUGS = new Set(["about", "contact", "courses", "faq", "gallery", "news", "plan", "services", "admin", "api", "media"]);

export function slugProblem(slug: string, taken: string[]): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط، مثل security-awareness.";
  if (RESERVED_SLUGS.has(slug)) return "هذا العنوان محجوز لصفحة موجودة في الموقع.";
  if (taken.includes(slug)) return "توجد صفحة بهذا العنوان.";
  return null;
}
