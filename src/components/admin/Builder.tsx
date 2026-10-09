"use client";

import { useState } from "react";
import { BLOCK_TYPES, blockLabel, slugProblem } from "@/lib/blocks";
import type { Json } from "./api";
import { Field, pathKey, summarize, type EditorContext, type Path } from "./Editor";
import { btn, card, h1, input, primary, secondary, small } from "./ui";

type Obj = { [k: string]: Json };
type Locale = "ar" | "en";
const asObj = (v: Json | undefined): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const asList = (v: Json | undefined): Json[] => (Array.isArray(v) ? v : []);

/**
 * The list of blocks of a page or a home page zone: each block is shown with
 * its display type and edited field by field; blocks can be added (choosing
 * the display type), moved, duplicated and deleted.
 */
export function BlocksEditor({
  blocks,
  reference,
  path,
  onChange,
  ctx,
}: {
  blocks: Json[];
  reference?: Json[];
  path: Path;
  onChange: (path: Path, value: Json) => void;
  ctx: EditorContext;
}) {
  const [adding, setAdding] = useState(false);
  const set = (next: Json[]) => onChange(path, next);
  const move = (i: number, d: 1 | -1) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const copy = blocks.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    set(copy);
  };

  return (
    <div className="flex flex-col gap-3" data-path={pathKey(path)}>
      {blocks.length === 0 ? <p className={`${card} text-[14px] text-muted`}>لا توجد أقسام بعد. أضف أول قسم واختر طريقة عرضه.</p> : null}
      {blocks.map((block, i) => {
        const b = asObj(block);
        const type = String(b.type ?? "");
        return (
          <div key={i} className="flex flex-col gap-3 border border-border-soft border-s-4 border-s-gold bg-white p-3" data-path={pathKey([...path, i])}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[14px] font-bold text-navy">
                {i + 1}. {blockLabel(type)}
                <span className="font-normal text-muted"> {summarize(block) ? `· ${summarize(block)}` : ""}</span>
              </span>
              <span className="flex shrink-0 gap-1">
                <button type="button" className={btn} disabled={i === 0} onClick={() => move(i, -1)} title="أعلى">
                  ↑
                </button>
                <button type="button" className={btn} disabled={i === blocks.length - 1} onClick={() => move(i, 1)} title="أسفل">
                  ↓
                </button>
                <button type="button" className={btn} onClick={() => set([...blocks.slice(0, i + 1), structuredClone(block), ...blocks.slice(i + 1)])}>
                  نسخ
                </button>
                <button
                  type="button"
                  className={`${btn} text-danger`}
                  onClick={() => window.confirm(`حذف القسم «${blockLabel(type)}»؟ يمكنك التراجع عن ذلك.`) && set(blocks.filter((_, k) => k !== i))}
                >
                  حذف
                </button>
              </span>
            </div>
            {Object.entries(b)
              .filter(([k]) => k !== "type")
              .map(([k, v]) => (
                <Field key={k} name={k} value={v} reference={asObj(reference?.[i])[k]} path={[...path, i, k]} onChange={onChange} ctx={ctx} depth={1} />
              ))}
          </div>
        );
      })}

      {adding ? (
        <div className={`${card} flex flex-col gap-2`}>
          <p className="text-[14px] font-bold text-navy">اختر طريقة عرض القسم الجديد</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {BLOCK_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                className="flex cursor-pointer flex-col items-start gap-1 border border-border-soft p-3 text-start hover:border-navy"
                onClick={() => {
                  set([...blocks, t.blank() as unknown as Json]);
                  setAdding(false);
                }}
              >
                <span className="text-[14px] font-bold text-navy">{t.label}</span>
                <span className={small}>{t.hint}</span>
              </button>
            ))}
          </div>
          <button type="button" className={`${secondary} h-9 self-start`} onClick={() => setAdding(false)}>
            إلغاء
          </button>
        </div>
      ) : (
        <button type="button" className={`${secondary} self-start`} onClick={() => setAdding(true)}>
          + إضافة قسم
        </button>
      )}
    </div>
  );
}

/** Copies the Arabic version's blocks into the English one, after asking. */
function CopyFromArabic({ onCopy }: { onCopy: () => void }) {
  return (
    <button
      type="button"
      className={btn}
      onClick={() => window.confirm("استبدال أقسام النسخة الإنجليزية بنسخة من الأقسام العربية لترجمتها؟") && onCopy()}
    >
      نسخ الأقسام من العربية للترجمة
    </button>
  );
}

/**
 * Pages editors create themselves, each at /<lang>/<slug> and built from
 * blocks. A page exists in both languages under the same address; creating,
 * renaming the address and deleting apply to both.
 */
export function PagesView({
  drafts,
  locale,
  selected,
  onSelect,
  onEdit,
  mutate,
  ctx,
}: {
  drafts: Record<Locale, Json | undefined>;
  locale: Locale;
  selected: string | null;
  onSelect: (slug: string | null) => void;
  onEdit: (path: Path, value: Json) => void;
  mutate: (change: (draft: Obj, locale: Locale) => Obj) => void;
  ctx: EditorContext;
}) {
  const pagesOf = (l: Locale) => asList(asObj(drafts[l]).customPages).map(asObj);
  const pages = pagesOf("ar");
  const slugs = Array.from(new Set([...pages, ...pagesOf("en")].map((p) => String(p.slug ?? ""))));
  const [form, setForm] = useState<{ slug: string; ar: string; en: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const slug = form.slug.trim().toLowerCase();
    const issue = !form.ar.trim() ? "اكتب عنوان الصفحة بالعربية." : slugProblem(slug, slugs);
    if (issue) return setProblem(issue);
    mutate((draft, l) => ({
      ...draft,
      customPages: [...asList(draft.customPages), { slug, title: (l === "ar" ? form.ar : form.en || form.ar).trim(), intro: "", image: "", blocks: [] }],
    }));
    setForm(null);
    setProblem(null);
    onSelect(slug);
  };

  const rename = (slug: string) => {
    const next = window.prompt("الرابط الجديد للصفحة (أحرف إنجليزية صغيرة وأرقام وشرطات):", slug)?.trim().toLowerCase();
    if (!next || next === slug) return;
    const issue = slugProblem(next, slugs.filter((s) => s !== slug));
    if (issue) return window.alert(issue);
    mutate((draft) => ({ ...draft, customPages: asList(draft.customPages).map((p) => (asObj(p).slug === slug ? { ...asObj(p), slug: next } : p)) }));
    onSelect(next);
    window.alert(`تغيّر الرابط إلى /${locale}/${next}. حدّث أي رابط إليها في «القائمة الرئيسية» أو غيرها.`);
  };

  const remove = (slug: string) => {
    if (!window.confirm("حذف هذه الصفحة باللغتين؟ يمكنك التراجع قبل الحفظ، أو استعادتها لاحقًا من سجل التعديلات.")) return;
    mutate((draft) => ({ ...draft, customPages: asList(draft.customPages).filter((p) => asObj(p).slug !== slug) }));
    onSelect(null);
  };

  const list = pagesOf(locale);
  const index = list.findIndex((p) => p.slug === selected);
  const page = index >= 0 ? list[index] : null;
  const arPage = pagesOf("ar").find((p) => p.slug === selected);

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={h1}>الصفحات</h1>
        {form ? null : (
          <button type="button" className={primary} onClick={() => setForm({ slug: "", ar: "", en: "" })}>
            + صفحة جديدة
          </button>
        )}
      </div>
      <p className={small}>
        صفحات تنشئها بنفسك (مثل التوعية الأمنية، السياسات، الأدلة، التقارير). كل صفحة تُبنى من أقسام تختار طريقة عرض كل منها. لإظهار
        صفحة في القائمة أضف رابطها في «القائمة الرئيسية».
      </p>

      {form ? (
        <form onSubmit={create} className={`${card} flex flex-col gap-3`}>
          <h2 className="text-[16px] font-bold text-navy">صفحة جديدة</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={small}>العنوان بالعربية</span>
              <input className={input} value={form.ar} onChange={(e) => setForm({ ...form, ar: e.target.value })} required />
            </label>
            <label className="flex flex-col gap-1">
              <span className={small}>العنوان بالإنجليزية</span>
              <input dir="ltr" className={input} value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className={small}>الرابط (أحرف إنجليزية صغيرة وشرطات): /ar/…</span>
              <input dir="ltr" className={input} placeholder="security-awareness" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </label>
          </div>
          {problem ? <p className="text-[13px] text-danger">{problem}</p> : null}
          <div className="flex gap-2">
            <button type="submit" className={primary}>
              إنشاء الصفحة
            </button>
            <button type="button" className={secondary} onClick={() => setForm(null)}>
              إلغاء
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {pages.length === 0 ? <p className={`${card} w-full text-[14px] text-muted`}>لا توجد صفحات بعد.</p> : null}
        {pages.map((p) => (
          <button
            key={String(p.slug)}
            type="button"
            onClick={() => onSelect(String(p.slug))}
            className={`${btn} h-9 ${selected === p.slug ? "border-navy font-bold" : ""}`}
          >
            {String(p.title || p.slug)}
          </button>
        ))}
      </div>

      {selected && !page ? (
        <div className={`${card} flex flex-col gap-2`}>
          <p className="text-[14px] text-navy">هذه الصفحة غير موجودة في هذه اللغة.</p>
          <button
            type="button"
            className={`${secondary} self-start`}
            onClick={() =>
              mutate((draft, l) =>
                l === locale && arPage ? { ...draft, customPages: [...asList(draft.customPages), structuredClone(arPage) as Json] } : draft,
              )
            }
          >
            إنشاؤها من النسخة العربية
          </button>
        </div>
      ) : null}

      {page ? (
        <div className="flex flex-col gap-4">
          <div className={`${card} flex flex-wrap items-center justify-between gap-2`}>
            <span className="text-[14px] text-navy">
              الرابط:{" "}
              <a dir="ltr" href={`/${locale}/${page.slug}`} target="_blank" rel="noreferrer" className="underline">
                /{locale}/{String(page.slug)}
              </a>
              <span className={small}> (يظهر بعد الحفظ)</span>
            </span>
            <span className="flex gap-2">
              <button type="button" className={btn} onClick={() => rename(String(page.slug))}>
                تغيير الرابط
              </button>
              <button type="button" className={`${btn} text-danger`} onClick={() => remove(String(page.slug))}>
                حذف الصفحة
              </button>
            </span>
          </div>
          {(["title", "intro", "image"] as const).map((k) => (
            <Field
              key={k}
              name={k}
              value={page[k] ?? ""}
              reference={locale === "en" ? arPage?.[k] : undefined}
              path={["customPages", index, k]}
              onChange={onEdit}
              ctx={ctx}
            />
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-4">
            <h2 className="text-[18px] font-bold text-navy">أقسام الصفحة</h2>
            {locale === "en" && arPage ? <CopyFromArabic onCopy={() => onEdit(["customPages", index, "blocks"], structuredClone(arPage.blocks ?? []))} /> : null}
          </div>
          <BlocksEditor
            blocks={asList(page.blocks)}
            reference={locale === "en" ? asList(arPage?.blocks) : undefined}
            path={["customPages", index, "blocks"]}
            onChange={onEdit}
            ctx={ctx}
          />
        </div>
      ) : null}
    </div>
  );
}

const ZONES = [
  { key: "afterHero", label: "بعد الصورة الرئيسية مباشرة", hint: "مثل الإجراءات السريعة للتدريسيين والطلبة، أو الإعلانات." },
  { key: "beforeFooter", label: "قبل التذييل", hint: "مثل «قدّم الآن ولا تفوّت فرصتك» أو «تعرّف على جامعة وارث الأنبياء»." },
] as const;

/** Blocks added to the home page, in its two zones. */
export function HomeBlocksView({
  draft,
  reference,
  locale,
  onEdit,
  ctx,
}: {
  draft: Json | undefined;
  reference: Json | undefined;
  locale: Locale;
  onEdit: (path: Path, value: Json) => void;
  ctx: EditorContext;
}) {
  const zones = asObj(asObj(draft).homeBlocks);
  const refZones = asObj(asObj(reference).homeBlocks);
  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-6">
      <h1 className={h1}>أقسام إضافية في الرئيسية</h1>
      <p className={small}>
        أقسام تضيفها إلى الصفحة الرئيسية وتختار طريقة عرضها. لإخفاء أقسام الرئيسية الأصلية استخدم «إظهار الأقسام».
      </p>
      {ZONES.map((zone) => (
        <section key={zone.key} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft pb-2">
            <div>
              <h2 className="text-[18px] font-bold text-navy">{zone.label}</h2>
              <p className={small}>{zone.hint}</p>
            </div>
            {locale === "en" ? (
              <CopyFromArabic onCopy={() => onEdit(["homeBlocks", zone.key], structuredClone(asList(refZones[zone.key])))} />
            ) : null}
          </div>
          <BlocksEditor
            blocks={asList(zones[zone.key])}
            reference={locale === "en" ? asList(refZones[zone.key]) : undefined}
            path={["homeBlocks", zone.key]}
            onChange={onEdit}
            ctx={ctx}
          />
        </section>
      ))}
    </div>
  );
}
