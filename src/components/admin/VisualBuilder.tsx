"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BLOCK_TYPES, blockLabel, slugProblem } from "@/lib/blocks";
import { SECTIONS, defaultHomeLayout } from "@/lib/layout";
import type { SiteContent } from "@/types/content";
import type { Json } from "./api";
import { Field, getAt, pathKey, setAt, summarize, type Path } from "./Editor";
import { SECTION_LABELS } from "./labels";
import { LivePreview, type PreviewRef, type PreviewSelection } from "./LivePreview";
import { findPathOf } from "./routing";
import { SaveControls } from "./SaveBar";
import { asList, asObject, useCms, type Locale, type Obj } from "./store";
import { btn, input, primary, secondary, small } from "./ui";
import { useFieldContext, GLOBAL_LABEL } from "./Views";
import { collectionAt } from "./collections";

/** Site pages whose structure is fixed: their content is edited by clicking it in the canvas. */
const FIXED_PAGES: { id: string; label: string }[] = [
  { id: "about", label: "من نحن" },
  { id: "services", label: "الخدمات" },
  { id: "courses", label: "الدورات والورش" },
  { id: "plan", label: "الخطة السنوية" },
  { id: "news", label: "الأخبار" },
  { id: "gallery", label: "معرض الصور" },
  { id: "faq", label: "الأسئلة الشائعة" },
  { id: "contact", label: "تواصل معنا" },
];

/* Distinguishes repeated highlight requests for the same thing. */
let ticks = 0;
const tick = () => ++ticks;

type Target = { kind: "layer"; index: number } | { kind: "global"; key: string } | { kind: "page" } | null;

const layerName = (item: Obj) =>
  item.type === "section"
    ? SECTIONS.find((s) => s.key === item.section)?.label ?? `${String(item.section)} (لم يعد موجودًا)`
    : `${blockLabel(String(item.type))}${summarize(item) ? ` · ${summarize(item)}` : ""}`;

/**
 * The page builder, laid out like a design tool: layers on one side, the
 * live page in the middle, the selected item's properties on the other.
 *
 * - Layers: the page's sections in order. Drag to reorder; the eye hides a
 *   section without deleting it; add built-in sections or new blocks.
 *   Changes to the structure apply to both languages.
 * - Canvas: the real site with unsaved changes. Click anything to select it
 *   (its layer and its field), double-click text to type over it.
 * - Properties: the fields of what is selected.
 */
export function VisualBuilder({ page: initialPage }: { page?: string }) {
  const { docs, locale, setLocale, edit, both, go, setFocus } = useCms();
  const [page, setPage] = useState(initialPage && initialPage !== "new" ? initialPage : "home");
  const [creating, setCreating] = useState(initialPage === "new");
  const [target, setTarget] = useState<Target>(null);
  const [highlight, setHighlight] = useState<{ ref?: PreviewRef | null; layer?: string | null; nonce: number } | null>(null);
  const [adding, setAdding] = useState(false);
  const [drag, setDrag] = useState<{ from: number; over: number | null } | null>(null);
  const propsRef = useRef<HTMLDivElement>(null);
  const ctx = useFieldContext(useBuilderLinks());

  const draftOf = (l: Locale) => asObject(docs[l]?.draft);
  const draft = draftOf(locale);
  const pagesOf = (l: Locale) => asList(draftOf(l).customPages).map(asObject);
  const fixed = FIXED_PAGES.find((p) => p.id === page);
  const custom = page !== "home" && !fixed;
  const pageIndex = (l: Locale) => pagesOf(l).findIndex((p) => p.slug === page);

  /** Where this page's layout lives in a language's document. */
  const layoutPath = (l: Locale): Path | null => {
    if (page === "home") return ["homeLayout"];
    if (custom && pageIndex(l) >= 0) return ["customPages", pageIndex(l), "blocks"];
    return null;
  };
  const sectionsSwitches = asObject(docs.settings?.draft).sections;
  const layoutOf = (l: Locale): Json[] => {
    const path = layoutPath(l);
    if (!path) return [];
    const stored = getAt(docs[l]?.draft, path);
    if (Array.isArray(stored)) return stored;
    return page === "home" ? (defaultHomeLayout({ ...(draftOf(l) as unknown as SiteContent), sections: sectionsSwitches as SiteContent["sections"] }) as unknown as Json[]) : [];
  };
  const layers = layoutOf(locale).map(asObject);
  const at = layoutPath(locale)?.join(".") ?? "";
  const previewPath = `/${locale}${page === "home" ? "" : `/${page}`}`;

  /* Structure changes apply to both languages while their layouts line up. */
  const aligned = layoutOf("ar").length === layoutOf("en").length;
  const restructure = (fn: (list: Json[], l: Locale) => Json[]) =>
    both((d, l) => {
      const path = layoutPath(l);
      if (!path || (!aligned && l !== locale)) return d;
      return setAt(d, path, fn(layoutOf(l), l)) as Obj;
    });

  const select = (next: Target, focusPath?: Path | null) => {
    setTarget(next);
    if (next?.kind === "layer") setHighlight({ layer: `${at}.${next.index}`, nonce: tick() });
    setFocus(focusPath ?? null);
  };

  const add = (item: Obj) => {
    const insertAt = target?.kind === "layer" ? target.index + 1 : layers.length;
    restructure((list) => [...list.slice(0, insertAt), structuredClone(item) as Json, ...list.slice(insertAt)]);
    setAdding(false);
    select({ kind: "layer", index: insertAt });
  };
  const remove = (i: number) => {
    if (!window.confirm(`حذف «${layerName(layers[i])}» من الصفحة باللغتين؟ يمكنك التراجع قبل الحفظ.`)) return;
    restructure((list) => list.filter((_, k) => k !== i));
    setTarget(null);
  };
  const duplicate = (i: number) => restructure((list) => [...list.slice(0, i + 1), structuredClone(list[i]), ...list.slice(i + 1)]);
  const toggle = (i: number) => restructure((list) => list.map((x, k) => (k === i ? ({ ...asObject(x), hidden: !asObject(x).hidden } as Json) : x)));
  const move = (from: number, to: number) => {
    if (from === to) return;
    restructure((list) => {
      const copy = list.slice();
      const [item] = copy.splice(from, 1);
      copy.splice(to > from ? to - 1 : to, 0, item);
      return copy;
    });
    setTarget({ kind: "layer", index: to > from ? to - 1 : to });
  };

  /* A click in the canvas: select its layer, and open the field it shows. */
  const onSelect = (sel: PreviewSelection) => {
    const path = layoutPath(locale);
    let fieldPath: Path | null = sel.ref && sel.ref.k === locale ? sel.ref.p : null;
    let layer: number | null = sel.layer && at && sel.layer.startsWith(`${at}.`) ? Number(sel.layer.slice(at.length + 1)) : null;
    if (path && fieldPath && path.every((p, i) => p === fieldPath![i])) layer = Number(fieldPath[path.length]);
    if (sel.media) {
      const within = layer !== null && path ? [...path, layer] : fieldPath ? fieldPath.slice(0, 1) : [];
      fieldPath = findPathOf(draft, sel.media, within) ?? fieldPath;
    }
    if (fieldPath && !(path && path.every((p, i) => p === fieldPath![i]))) {
      /* A built-in section's (or the header's, the footer's) own content. */
      const key = String(fieldPath[0]);
      const index = layers.findIndex((l) => l.type === "section" && l.section === key);
      setTarget(index >= 0 ? { kind: "layer", index } : { kind: "global", key });
    } else if (layer !== null && !Number.isNaN(layer)) setTarget({ kind: "layer", index: layer });
    setFocus(fieldPath);
  };

  /* Focusing a field outlines it in the canvas. */
  useEffect(() => {
    const el = propsRef.current;
    if (!el) return;
    const onFocus = (e: FocusEvent) => {
      const holder = (e.target as HTMLElement).closest("[data-path]");
      if (!holder) return;
      try {
        setHighlight({ ref: { k: locale, p: JSON.parse(holder.getAttribute("data-path") ?? "[]") }, nonce: tick() });
      } catch {}
    };
    el.addEventListener("focusin", onFocus);
    return () => el.removeEventListener("focusin", onFocus);
  }, [locale]);

  const onNavigate = (path: string) => {
    const rest = path.replace(/^\/(ar|en)\/?/, "");
    const next = rest === "" ? "home" : rest.split("/")[0];
    if (next !== page && (next === "home" || FIXED_PAGES.some((p) => p.id === next) || pagesOf(locale).some((p) => p.slug === next))) {
      setPage(next);
      setTarget(null);
    }
  };

  const selectedLayer = target?.kind === "layer" ? layers[target.index] : null;

  return (
    <div className="flex h-dvh flex-col bg-surface">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-soft bg-white px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" className={btn} onClick={() => go({ name: "dashboard" })} title="لوحة التحكم">
            → لوحة التحكم
          </button>
          <select
            value={page}
            onChange={(e) => {
              if (e.target.value === "new") return setCreating(true);
              setPage(e.target.value);
              setTarget(null);
            }}
            className="h-9 max-w-[220px] border border-border-soft bg-white px-2 text-[14px] font-bold text-navy"
          >
            <optgroup label="صفحات تُبنى بالأقسام">
              <option value="home">الصفحة الرئيسية</option>
              {pagesOf("ar").map((p) => (
                <option key={String(p.slug)} value={String(p.slug)}>
                  {String(p.title || p.slug)}
                </option>
              ))}
              <option value="new">+ صفحة جديدة…</option>
            </optgroup>
            <optgroup label="صفحات ثابتة (تعديل المحتوى)">
              {FIXED_PAGES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          </select>
          <span className="flex border border-border-soft" role="group" aria-label="اللغة">
            {(["ar", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`h-9 cursor-pointer px-3 text-[13px] ${locale === l ? "bg-navy font-bold text-white" : "text-navy"}`}
              >
                {l === "ar" ? "العربية" : "English"}
              </button>
            ))}
          </span>
        </div>
        <SaveControls compact />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)_360px]">
        {/* Layers */}
        <aside className="flex min-h-0 flex-col border-e border-border-soft bg-white">
          <div className="flex items-center justify-between border-b border-border-soft px-3 py-2">
            <span className="text-[13px] font-bold text-navy">الطبقات</span>
            {fixed ? null : (
              <button type="button" className={btn} onClick={() => setAdding((v) => !v)}>
                + إضافة
              </button>
            )}
          </div>
          {fixed ? (
            <p className="p-3 text-[13px] leading-6 text-muted">
              بنية «{fixed.label}» ثابتة. انقر أي نص أو صورة في المعاينة لتعديله، أو انقر مرتين على نص لتكتب فوقه مباشرة.
            </p>
          ) : (
            <ol className="min-h-0 flex-1 overflow-y-auto py-1">
              {custom ? (
                <li>
                  <button
                    type="button"
                    onClick={() => select({ kind: "page" })}
                    className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-start text-[13px] ${target?.kind === "page" ? "bg-navy text-white" : "text-navy hover:bg-surface"}`}
                  >
                    ⚙ إعدادات الصفحة
                  </button>
                </li>
              ) : null}
              {layers.map((item, i) => (
                <li
                  key={i}
                  draggable
                  onDragStart={() => setDrag({ from: i, over: null })}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (drag) setDrag({ ...drag, over: i });
                  }}
                  onDragEnd={() => setDrag(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (drag) move(drag.from, i);
                    setDrag(null);
                  }}
                  className={`group flex items-center gap-1 border-t-2 px-1 ${drag?.over === i ? "border-gold" : "border-transparent"} ${
                    target?.kind === "layer" && target.index === i ? "bg-navy text-white" : "text-navy hover:bg-surface"
                  }`}
                >
                  <span className="cursor-grab px-1 text-[13px] opacity-50" title="اسحب لإعادة الترتيب" aria-hidden>
                    ⋮⋮
                  </span>
                  <button
                    type="button"
                    onClick={() => select({ kind: "layer", index: i })}
                    className={`min-w-0 flex-1 cursor-pointer truncate py-2 text-start text-[13px] ${item.hidden ? "line-through opacity-50" : ""}`}
                    title={layerName(item)}
                  >
                    <span className="me-1 text-[11px] opacity-60">{item.type === "section" ? "▣" : "◆"}</span>
                    {layerName(item)}
                  </button>
                  <button type="button" onClick={() => toggle(i)} title={item.hidden ? "إظهار" : "إخفاء"} className="cursor-pointer px-1 text-[13px] opacity-70 hover:opacity-100">
                    {item.hidden ? "◌" : "◉"}
                  </button>
                  <span className="hidden gap-0.5 group-hover:flex">
                    <button type="button" onClick={() => duplicate(i)} title="نسخ" className="cursor-pointer px-1 text-[12px]">
                      ⧉
                    </button>
                    <button type="button" onClick={() => remove(i)} title="حذف" className="cursor-pointer px-1 text-[12px] text-danger">
                      ✕
                    </button>
                  </span>
                </li>
              ))}
              <li
                onDragOver={(e) => {
                  e.preventDefault();
                  if (drag) setDrag({ ...drag, over: layers.length });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag) move(drag.from, layers.length);
                  setDrag(null);
                }}
                className={`h-6 border-t-2 ${drag?.over === layers.length ? "border-gold" : "border-transparent"}`}
              />
            </ol>
          )}
          {!aligned && !fixed ? <p className="border-t border-border-soft p-2 text-[11px] text-muted">ترتيب اللغتين مختلف؛ التغييرات تطبق على اللغة الحالية فقط.</p> : null}
        </aside>

        {/* Canvas */}
        <main className="relative min-h-0">
          <LivePreview path={previewPath} onSelect={onSelect} onNavigate={onNavigate} highlight={highlight} />
          {adding ? (
            <AddPanel
              onClose={() => setAdding(false)}
              onAdd={add}
              used={layers.filter((l) => l.type === "section").map((l) => String(l.section))}
            />
          ) : null}
          {creating ? (
            <NewPage
              taken={pagesOf("ar").map((p) => String(p.slug))}
              onClose={() => setCreating(false)}
              onCreate={(slug, ar, en) => {
                both((d, l) => ({
                  ...d,
                  customPages: [...asList(d.customPages), { slug, title: l === "ar" ? ar : en || ar, intro: "", image: "", blocks: [] }],
                }));
                setCreating(false);
                setPage(slug);
                setTarget({ kind: "page" });
              }}
            />
          ) : null}
        </main>

        {/* Properties */}
        <aside ref={propsRef} className="min-h-0 overflow-y-auto border-s border-border-soft bg-white">
          <div className="sticky top-0 z-10 border-b border-border-soft bg-white px-4 py-2">
            <span className="text-[13px] font-bold text-navy">الخصائص</span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            {target === null ? (
              <p className="text-[13px] leading-6 text-muted">
                اختر طبقة، أو انقر أي عنصر في المعاينة لتعديله. انقر مرتين على نص لتكتب فوقه مباشرة. اسحب الطبقات لإعادة ترتيبها، والعين لإخفاء قسم.
              </p>
            ) : null}

            {target?.kind === "page" && custom ? (
              <PageSettings
                slug={page}
                index={pageIndex(locale)}
                taken={pagesOf("ar").map((p) => String(p.slug))}
                onRenamed={(slug) => setPage(slug)}
                onDeleted={() => {
                  setPage("home");
                  setTarget(null);
                }}
              />
            ) : null}

            {selectedLayer && target?.kind === "layer" ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-bold text-navy">{layerName(selectedLayer)}</span>
                  <span className="flex gap-1">
                    <button type="button" className={btn} onClick={() => toggle(target.index)}>
                      {selectedLayer.hidden ? "إظهار" : "إخفاء"}
                    </button>
                    <button type="button" className={`${btn} text-danger`} onClick={() => remove(target.index)}>
                      حذف
                    </button>
                  </span>
                </div>
                {selectedLayer.type === "section" ? (
                  <>
                    <p className={small}>محتوى هذا القسم مشترك أينما ظهر في الموقع.</p>
                    <SectionFields sectionKey={String(selectedLayer.section)} ctx={ctx} />
                  </>
                ) : (
                  Object.entries(selectedLayer)
                    .filter(([k]) => k !== "type" && k !== "hidden")
                    .map(([k, v]) => {
                      const path = [...(layoutPath(locale) ?? []), target.index, k];
                      const ensure = () => {
                        /* Materialise the home layout the first time a block is edited. */
                        if (!Array.isArray(getAt(docs[locale]?.draft, layoutPath(locale) ?? []))) restructure((list) => list);
                      };
                      return (
                        <Field
                          key={`${locale}:${target.index}:${k}`}
                          name={k}
                          value={v}
                          reference={locale === "en" ? asObject(layoutOf("ar")[target.index])[k] : undefined}
                          path={path}
                          onChange={(p, value) => {
                            ensure();
                            edit(locale)(p, value);
                          }}
                          ctx={ctx}
                          depth={1}
                        />
                      );
                    })
                )}
              </>
            ) : null}

            {target?.kind === "global" ? (
              <>
                <span className="text-[15px] font-bold text-navy">{GLOBAL_LABEL(target.key)}</span>
                <SectionFields sectionKey={target.key} ctx={ctx} />
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** In the builder, a section's lists that are collections link to their tables. */
function useBuilderLinks() {
  const { go } = useCms();
  return function collectionLink(path: Path, value: Json) {
    const c = collectionAt(path);
    if (!c) return undefined;
    return (
      <div className="flex items-center justify-between gap-2 border border-border-soft bg-surface p-3" data-path={pathKey(path)}>
        <span className="text-[13px] text-navy">
          <span className="font-bold">{c.label}</span> · {asList(value).length}
        </span>
        <button type="button" className={btn} onClick={() => go({ name: "collection", id: c.id })}>
          إدارة ←
        </button>
      </div>
    );
  };
}

function SectionFields({ sectionKey, ctx }: { sectionKey: string; ctx: ReturnType<typeof useFieldContext> }) {
  const { docs, locale, edit } = useCms();
  const value = asObject(docs[locale]?.draft)[sectionKey];
  const reference = locale === "en" ? asObject(docs.ar?.draft)[sectionKey] : undefined;
  if (value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return <Field name={sectionKey} value={value} reference={reference} path={[sectionKey]} onChange={edit(locale)} ctx={ctx} depth={1} />;
  }
  return (
    <>
      {Object.entries(value).map(([k, v]) => (
        <Field key={`${locale}:${sectionKey}:${k}`} name={k} value={v} reference={asObject(reference)[k]} path={[sectionKey, k]} onChange={edit(locale)} ctx={ctx} depth={1} />
      ))}
    </>
  );
}

function AddPanel({ onAdd, onClose, used }: { onAdd: (item: Obj) => void; onClose: () => void; used: string[] }) {
  const [tab, setTab] = useState<"blocks" | "sections">("blocks");
  return (
    <div className="absolute inset-y-0 start-0 z-20 flex w-[340px] flex-col border-e border-border-soft bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-border-soft px-3 py-2">
        <span className="text-[14px] font-bold text-navy">إضافة قسم</span>
        <button type="button" className={btn} onClick={onClose}>
          إغلاق
        </button>
      </div>
      <div className="flex border-b border-border-soft">
        {(["blocks", "sections"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 cursor-pointer py-2 text-[13px] ${tab === t ? "border-b-2 border-gold font-bold text-navy" : "text-muted"}`}
          >
            {t === "blocks" ? "أقسام جديدة" : "أقسام الموقع"}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {tab === "blocks"
          ? BLOCK_TYPES.map((t) => (
              <button key={t.type} type="button" onClick={() => onAdd(t.blank() as unknown as Obj)} className="flex cursor-pointer flex-col items-start gap-1 border border-border-soft p-3 text-start hover:border-navy">
                <span className="text-[14px] font-bold text-navy">{t.label}</span>
                <span className={small}>{t.hint}</span>
              </button>
            ))
          : SECTIONS.map((s) => (
              <button key={s.key} type="button" onClick={() => onAdd({ type: "section", section: s.key })} className="flex cursor-pointer items-center justify-between gap-2 border border-border-soft p-3 text-start hover:border-navy">
                <span className="text-[14px] font-bold text-navy">{s.label}</span>
                {used.includes(s.key) ? <span className="text-[11px] text-muted">في الصفحة</span> : null}
              </button>
            ))}
      </div>
    </div>
  );
}

function NewPage({ taken, onCreate, onClose }: { taken: string[]; onCreate: (slug: string, ar: string, en: string) => void; onClose: () => void }) {
  const [form, setForm] = useState({ slug: "", ar: "", en: "" });
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-navy/40 p-4">
      <form
        className="flex w-full max-w-[460px] flex-col gap-3 bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const slug = form.slug.trim().toLowerCase();
          const issue = !form.ar.trim() ? "اكتب عنوان الصفحة بالعربية." : slugProblem(slug, taken);
          if (issue) return setProblem(issue);
          onCreate(slug, form.ar.trim(), form.en.trim());
        }}
      >
        <h2 className="text-[18px] font-bold text-navy">صفحة جديدة</h2>
        <label className="flex flex-col gap-1">
          <span className={small}>العنوان بالعربية</span>
          <input className={input} value={form.ar} onChange={(e) => setForm({ ...form, ar: e.target.value })} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className={small}>العنوان بالإنجليزية</span>
          <input dir="ltr" className={input} value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={small}>الرابط: /ar/…</span>
          <input dir="ltr" className={input} placeholder="security-awareness" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
        </label>
        {problem ? <p className="text-[13px] text-danger">{problem}</p> : null}
        <div className="flex gap-2">
          <button type="submit" className={primary}>
            إنشاء
          </button>
          <button type="button" className={secondary} onClick={onClose}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

function PageSettings({
  slug,
  index,
  taken,
  onRenamed,
  onDeleted,
}: {
  slug: string;
  index: number;
  taken: string[];
  onRenamed: (slug: string) => void;
  onDeleted: () => void;
}) {
  const { docs, locale, edit, both } = useCms();
  const ctx = useFieldContext();
  const page = asObject(asList(asObject(docs[locale]?.draft).customPages)[index]);
  const arPage = asObject(asList(asObject(docs.ar?.draft).customPages).find((p) => asObject(p).slug === slug));
  const fields = useMemo(() => ["title", "intro", "image"] as const, []);
  if (index < 0) return <p className={small}>هذه الصفحة غير موجودة بهذه اللغة.</p>;
  return (
    <>
      <span className="text-[15px] font-bold text-navy">إعدادات الصفحة</span>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-navy">
        الرابط:{" "}
        <a dir="ltr" href={`/${locale}/${slug}`} target="_blank" rel="noreferrer" className="underline">
          /{locale}/{slug}
        </a>
      </div>
      {fields.map((k) => (
        <Field key={`${locale}:${k}`} name={k} value={page[k] ?? ""} reference={locale === "en" ? arPage[k] : undefined} path={["customPages", index, k]} onChange={edit(locale)} ctx={ctx} />
      ))}
      <div className="flex gap-2 border-t border-border-soft pt-3">
        <button
          type="button"
          className={btn}
          onClick={() => {
            const next = window.prompt("الرابط الجديد (أحرف إنجليزية صغيرة وأرقام وشرطات):", slug)?.trim().toLowerCase();
            if (!next || next === slug) return;
            const issue = slugProblem(next, taken.filter((s) => s !== slug));
            if (issue) return window.alert(issue);
            both((d) => ({ ...d, customPages: asList(d.customPages).map((p) => (asObject(p).slug === slug ? { ...asObject(p), slug: next } : p)) }));
            onRenamed(next);
          }}
        >
          تغيير الرابط
        </button>
        <button
          type="button"
          className={`${btn} text-danger`}
          onClick={() => {
            if (!window.confirm("حذف هذه الصفحة باللغتين؟ يمكنك التراجع قبل الحفظ.")) return;
            both((d) => ({ ...d, customPages: asList(d.customPages).filter((p) => asObject(p).slug !== slug) }));
            onDeleted();
          }}
        >
          حذف الصفحة
        </button>
      </div>
      <p className={small}>لإظهار الصفحة في القائمة أضف رابطها في «القائمة الرئيسية» من العامة.</p>
    </>
  );
}

export { SECTION_LABELS };
