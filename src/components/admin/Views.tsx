"use client";

import { useEffect, useMemo, useState } from "react";
import { api, errorText, formatDate, uploadFile, type DocKey, type Json } from "./api";
import { IMAGE_HINT } from "./images";
import { COLLECTIONS, GLOBAL_GROUPS, collectionAt, globalUrl, type CollectionDef } from "./collections";
import { Field, GALLERY_KEYS, MultiImageField, blank, getAt, setAt, summarize, withSiblingFields, type EditorContext, type Path } from "./Editor";
import { DOC_LABELS } from "./History";
import { SECTION_LABELS, labelFor } from "./labels";
import { LivePreview, type PreviewSelection } from "./LivePreview";
import { findPathOf, routeForPath, sameRoute } from "./routing";
import { asList, asObject, useCms, type Locale, type Obj, type Route } from "./store";
import { btn, card, input, primary, secondary, small } from "./ui";
import { plainText } from "./RichEditor";

export interface Crumb {
  label: string;
  route?: Route;
}

/** Remembers whether the live preview is open, per browser. */
function usePreviewOpen(): [boolean, (v: boolean) => void] {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cms-preview") === "1";
      if (saved) {
        const t = setTimeout(() => setOpen(true), 0);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);
  return [
    open,
    (v: boolean) => {
      setOpen(v);
      try {
        localStorage.setItem("cms-preview", v ? "1" : "0");
      } catch {}
    },
  ];
}

export function LocaleSelect() {
  const { locale, setLocale, isDirty } = useCms();
  return (
    <label className="flex items-center gap-2 text-[13px] text-muted">
      اللغة
      <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className="h-9 border border-border-soft bg-white px-2 text-[14px] text-navy">
        <option value="ar">العربية{isDirty("ar") ? " •" : ""}</option>
        <option value="en">English{isDirty("en") ? " •" : ""}</option>
      </select>
    </label>
  );
}

/**
 * The edit screen for one document or item, as in Strapi and Payload:
 * breadcrumbs and title, the language, the live preview toggle, the fields,
 * and a side panel with the document's information.
 */
export function DocumentView({
  crumbs,
  title,
  docKey,
  localized = true,
  previewPath,
  actions,
  side,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  docKey: DocKey;
  localized?: boolean;
  previewPath?: string;
  actions?: React.ReactNode;
  side?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { docs, go, route, setFocus, isDirty } = useCms();
  const [previewOpen, setPreviewOpen] = usePreviewOpen();
  const doc = docs[docKey];

  /* A click in the preview opens the field (on this screen, or the screen that edits it). */
  const onSelect = (sel: PreviewSelection) => {
    const draft = sel.ref && (sel.ref.k === "ar" || sel.ref.k === "en") ? docs[sel.ref.k]?.draft : docs[docKey]?.draft;
    let path = sel.ref?.p ?? null;
    if (sel.media) path = findPathOf(draft, sel.media, path ? path.slice(0, -1) : []) ?? path;
    if (!path) return;
    const target = routeForPath(path, draft);
    if (!sameRoute(target, route)) go(target);
    setFocus(path);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-border-soft bg-white px-5 pb-3 pt-4 md:px-8">
        <div className="flex min-w-0 flex-col gap-1">
          <nav aria-label="المسار" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i ? <span aria-hidden>›</span> : null}
                {c.route ? (
                  <button type="button" className="cursor-pointer hover:text-navy hover:underline" onClick={() => go(c.route!)}>
                    {c.label}
                  </button>
                ) : (
                  <span>{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          <h1 className="truncate text-[24px] font-bold leading-tight text-navy">{title || "بدون عنوان"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {localized ? <LocaleSelect /> : null}
          {previewPath ? (
            <button type="button" className={`${secondary} h-9 ${previewOpen ? "border-navy font-bold" : ""}`} onClick={() => setPreviewOpen(!previewOpen)}>
              {previewOpen ? "إخفاء المعاينة" : "معاينة مباشرة"}
            </button>
          ) : null}
        </div>
      </div>
      <div className={`grid min-h-0 flex-1 ${previewOpen && previewPath ? "grid-cols-1 xl:grid-cols-[minmax(420px,1fr)_minmax(0,1.25fr)]" : "grid-cols-1"}`}>
        <div className="min-h-0 overflow-y-auto">
          <div className={`mx-auto flex gap-6 p-5 md:p-8 ${previewOpen ? "max-w-[760px] flex-col" : "max-w-[1200px] flex-col lg:flex-row lg:items-start"}`}>
            <div className="flex min-w-0 flex-1 flex-col gap-4">{children}</div>
            <aside className={`flex shrink-0 flex-col gap-3 ${previewOpen ? "" : "lg:sticky lg:top-0 lg:w-[280px]"}`}>
              <div className={`${card} flex flex-col gap-2 text-[13px]`}>
                <span className="text-[12px] font-bold text-muted">الحالة</span>
                <span className={`self-start px-2 py-0.5 text-[12px] font-bold ${isDirty(docKey) ? "bg-gold/30 text-navy" : "bg-[#e3f5e9] text-[#1b6b3a]"}`}>
                  {isDirty(docKey) ? "تعديلات غير منشورة" : "منشور"}
                </span>
                {doc ? (
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <dt className="text-muted">آخر نشر</dt>
                    <dd className="text-navy">{formatDate(doc.updatedAt)}</dd>
                    <dt className="text-muted">بواسطة</dt>
                    <dd className="text-navy">{doc.updatedBy ?? "—"}</dd>
                    <dt className="text-muted">النسخة</dt>
                    <dd className="text-navy">{doc.version}</dd>
                    <dt className="text-muted">المستند</dt>
                    <dd className="text-navy">{DOC_LABELS[docKey]}</dd>
                  </dl>
                ) : null}
                {previewPath ? (
                  <a href={previewPath} target="_blank" rel="noreferrer" className="mt-1 text-navy underline">
                    فتح في الموقع ↗
                  </a>
                ) : null}
                <button type="button" className="self-start text-navy underline" onClick={() => go({ name: "history" })}>
                  سجل التعديلات
                </button>
              </div>
              {side}
            </aside>
          </div>
        </div>
        {previewOpen && previewPath ? (
          <div className="hidden min-h-0 border-s border-border-soft xl:block">
            <LivePreview path={previewPath} onSelect={onSelect} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Builds the field context for the current language (and the Arabic reference while editing English). */
export function useFieldContext(override?: EditorContext["override"]): EditorContext {
  const { locale, focus } = useCms();
  return { dir: locale === "ar" ? "rtl" : "ltr", referenceLabel: locale === "en" ? "العربية" : undefined, focus: focus?.path, override };
}

/** In a global, a list that is managed as a collection shows as a link to it. */
function useCollectionLinks(): EditorContext["override"] {
  const { go } = useCms();
  return function collectionLink(path, value) {
    const c = collectionAt(path);
    if (!c) return undefined;
    return (
      <div className={`${card} flex items-center justify-between gap-3`}>
        <span className="text-[14px] text-navy">
          <span className="font-bold">{c.label}</span>
          <span className="text-muted"> · {asList(value).length} عنصر</span>
        </span>
        <button type="button" className={btn} onClick={() => go({ name: "collection", id: c.id })}>
          إدارة العناصر ←
        </button>
      </div>
    );
  };
}

const itemsOf = (draft: Json | undefined, c: CollectionDef): Json[] => asList(getAt(draft, c.path));

/** The table of a collection: search, create, duplicate, move and delete; a row opens its item. */
export function CollectionList({ id }: { id: string }) {
  const { docs, locale, go, both } = useCms();
  const c = COLLECTIONS.find((x) => x.id === id);
  const [query, setQuery] = useState("");
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const items = useMemo(() => (c ? itemsOf(docs[locale]?.draft, c) : []), [c, docs, locale]);
  if (!c) return null;

  /* Structural changes apply to both languages while their lists line up. */
  const aligned = itemsOf(docs.ar?.draft, c).length === itemsOf(docs.en?.draft, c).length;
  const change = (fn: (list: Json[], l: Locale) => Json[]) =>
    both((draft, l) => (aligned || l === locale ? (setAt(draft, c.path, fn(itemsOf(draft, c), l)) as Obj) : draft));

  const create = () => {
    const template = items.length ? blank(items[0]) : {};
    const item = asObject(template);
    if (c.slug) item.slug = `${c.id}-${Date.now().toString(36)}`;
    if ("href" in item && c.slug) item.href = "";
    change((list) => [...list, structuredClone(item)]);
    go({ name: "item", id: c.id, index: items.length });
  };
  const duplicate = (i: number) =>
    change((list) => {
      const copy = asObject(structuredClone(list[i]));
      if (c.slug && typeof copy.slug === "string") copy.slug = `${copy.slug}-copy`;
      return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)];
    });
  const remove = (i: number) => {
    const name = plainText(String(asObject(items[i])[c.title] ?? ""));
    if (window.confirm(`حذف «${name || c.singular}» من اللغتين؟ يمكنك التراجع قبل الحفظ.`)) change((list) => list.filter((_, k) => k !== i));
  };
  const move = (i: number, d: -1 | 1) =>
    change((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const copy = list.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  /* Several pictures at once: one new item per picture, in both languages. */
  const bulkUpload = async (files: FileList | null) => {
    const key = c.bulkImage;
    const list = Array.from(files ?? []);
    if (!key || !list.length) return;
    setBulkErrors([]);
    const urls: string[] = [];
    const failed: string[] = [];
    for (const [i, file] of list.entries()) {
      setBulk({ done: i, total: list.length });
      try {
        urls.push((await uploadFile(file)).url);
      } catch (e) {
        failed.push(`${file.name}: ${errorText(e)}`);
      }
    }
    setBulk(null);
    setBulkErrors(failed);
    if (!urls.length) return;
    change((list) => {
      const template = asObject(list.length ? blank(list[0]) : { [c.title]: "" });
      return [...list, ...urls.map((url) => ({ ...structuredClone(template), [key]: url }) as Json)];
    });
  };

  const q = query.trim().toLowerCase();
  const rows = items.map((item, i) => ({ item: asObject(item), i })).filter(({ item }) => !q || JSON.stringify(item).toLowerCase().includes(q));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-border-soft bg-white px-5 pb-3 pt-4 md:px-8">
        <div className="flex flex-col gap-1">
          <nav className="text-[13px] text-muted">
            <button type="button" className="cursor-pointer hover:underline" onClick={() => go({ name: "dashboard" })}>
              المجموعات
            </button>{" "}
            › {c.label}
          </nav>
          <h1 className="text-[24px] font-bold text-navy">{c.label}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSelect />
          {c.bulkImage ? (
            <label className={`${secondary} h-9`}>
              {bulk ? `جارٍ رفع ${bulk.done + 1} من ${bulk.total}…` : "رفع عدة صور معًا"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={Boolean(bulk)}
                onChange={(e) => {
                  void bulkUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
          <button type="button" className={`${primary} h-9`} onClick={create}>
            + {c.singular} جديد
          </button>
        </div>
        {c.bulkImage ? (
          <div className="flex w-full flex-col gap-1">
            <p className={small}>{IMAGE_HINT} تصبح كل صورة عنصرًا جديدًا (في اللغتين ما دامت القائمتان متطابقتين)، ثم يمكنك كتابة تعليقها.</p>
            {bulkErrors.map((e) => (
              <p key={e} className="text-[12px] text-danger">
                {e}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input className={`${input} max-w-[360px]`} placeholder={`بحث في ${c.label}…`} value={query} onChange={(e) => setQuery(e.target.value)} />
            <span className={small}>{items.length} عنصر</span>
          </div>
          <div className="overflow-x-auto border border-border-soft bg-white">
            <table className="w-full min-w-[640px] border-collapse text-start text-[14px]">
              <thead className="bg-surface text-[12px] text-muted">
                <tr>
                  <th className="w-12 px-3 py-2 text-start font-bold">#</th>
                  {c.image ? <th className="w-20 px-3 py-2 text-start font-bold">الصورة</th> : null}
                  <th className="px-3 py-2 text-start font-bold">{labelFor(c.title)}</th>
                  {c.subtitle ? <th className="px-3 py-2 text-start font-bold">{labelFor(c.subtitle)}</th> : null}
                  <th className="w-[260px] px-3 py-2 text-start font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ item, i }) => (
                  <tr key={i} className="cursor-pointer border-t border-border-soft hover:bg-surface/60" onClick={() => go({ name: "item", id: c.id, index: i })}>
                    <td className="px-3 py-2 text-muted">{i + 1}</td>
                    {c.image ? (
                      <td className="px-3 py-2">
                        {typeof item[c.image] === "string" && item[c.image] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={String(item[c.image])} alt="" className="h-11 w-16 bg-surface object-cover" />
                        ) : (
                          <span className="block h-11 w-16 bg-surface" />
                        )}
                      </td>
                    ) : null}
                    <td className="px-3 py-2 font-bold text-navy" dir="auto">
                      {plainText(String(item[c.title] ?? "")) || summarize(item) || "بدون عنوان"}
                    </td>
                    {c.subtitle ? <td className="px-3 py-2 text-muted" dir="auto">{plainText(String(item[c.subtitle] ?? ""))}</td> : null}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <span className="flex flex-wrap gap-1">
                        <button type="button" className={btn} onClick={() => go({ name: "item", id: c.id, index: i })}>
                          تعديل
                        </button>
                        <button type="button" className={btn} disabled={i === 0} onClick={() => move(i, -1)} title="أعلى">
                          ↑
                        </button>
                        <button type="button" className={btn} disabled={i === items.length - 1} onClick={() => move(i, 1)} title="أسفل">
                          ↓
                        </button>
                        <button type="button" className={btn} onClick={() => duplicate(i)}>
                          نسخ
                        </button>
                        <button type="button" className={`${btn} text-danger`} onClick={() => remove(i)}>
                          حذف
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted">
                      لا توجد عناصر.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {!aligned ? (
            <p className={small}>عدد العناصر يختلف بين اللغتين، لذا تُطبَّق الإضافة والحذف والترتيب على اللغة الحالية فقط.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The edit screen of one collection item. */
export function ItemEdit({ id, index }: { id: string; index: number }) {
  const { docs, locale, edit, go, both } = useCms();
  const c = COLLECTIONS.find((x) => x.id === id);
  /* An item's pictures are the same in both languages, so they are saved to both. */
  const ctx = useFieldContext((path, value, name) => {
    if (!c || !GALLERY_KEYS.has(name) || path.length !== c.path.length + 2) return undefined;
    const list = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
    return (
      <MultiImageField
        label={labelFor(name)}
        name={name}
        value={list}
        onChange={(next) => both((draft, l) => (l === locale || getAt(draft, path.slice(0, -1)) ? (setAt(draft, path, next) as Obj) : draft))}
      />
    );
  });
  if (!c) return null;
  const items = itemsOf(docs[locale]?.draft, c);
  const item = asObject(items[index]);
  const reference = locale === "en" ? asObject(itemsOf(docs.ar?.draft, c)[index]) : undefined;
  if (!items[index]) {
    return (
      <div className="p-8">
        <p className={small}>هذا العنصر غير موجود في هذه اللغة.</p>
        <button type="button" className={btn} onClick={() => go({ name: "collection", id })}>
          العودة إلى {c.label}
        </button>
      </div>
    );
  }
  const title = plainText(String(item[c.title] ?? "")) || summarize(item);
  const remove = () => {
    if (!window.confirm(`حذف «${title || c.singular}» من اللغتين؟`)) return;
    both((draft) => setAt(draft, c.path, itemsOf(draft, c).filter((_, k) => k !== index)) as Obj);
    go({ name: "collection", id });
  };

  return (
    <DocumentView
      crumbs={[{ label: "المجموعات", route: { name: "dashboard" } }, { label: c.label, route: { name: "collection", id } }, { label: title || c.singular }]}
      title={title}
      docKey={locale}
      previewPath={c.url(locale, item)}
      actions={
        <span className="flex gap-1">
          <button type="button" className={btn} disabled={index === 0} onClick={() => go({ name: "item", id, index: index - 1 })}>
            السابق
          </button>
          <button type="button" className={btn} disabled={index >= items.length - 1} onClick={() => go({ name: "item", id, index: index + 1 })}>
            التالي
          </button>
          <button type="button" className={`${btn} text-danger`} onClick={remove}>
            حذف
          </button>
        </span>
      }
    >
      {withSiblingFields(items[index], [...items, ...itemsOf(docs[locale === "ar" ? "en" : "ar"]?.draft, c), ...(c.fields ? [c.fields] : [])]).map(([k, v]) => (
        <Field key={`${locale}:${index}:${k}`} name={k} value={v} reference={reference?.[k]} path={[...c.path, index, k]} onChange={edit(locale)} ctx={ctx} depth={1} />
      ))}
    </DocumentView>
  );
}

const GLOBAL_LABEL = (key: string) => (key === "pages" ? "رؤوس الصفحات الداخلية" : key === "settings" ? "إظهار الأقسام" : SECTION_LABELS[key] ?? key);

/** The edit screen of a global (a section's texts, the footer, the menu…). */
export function GlobalEdit({ globalKey }: { globalKey: string }) {
  const { docs, locale, edit } = useCms();
  const ctx = useFieldContext(useCollectionLinks());
  const draft = asObject(docs[locale]?.draft);
  const value = draft[globalKey];
  const reference = locale === "en" ? asObject(docs.ar?.draft)[globalKey] : undefined;
  const group = GLOBAL_GROUPS.find((g) => g.keys.includes(globalKey))?.label ?? "العامة";
  if (value === undefined) return <p className="p-8 text-muted">غير موجود.</p>;
  const entries: [string, Json][] = value && typeof value === "object" && !Array.isArray(value) ? Object.entries(value) : [[globalKey, value]];
  return (
    <DocumentView
      crumbs={[{ label: "العامة", route: { name: "dashboard" } }, { label: group }, { label: GLOBAL_LABEL(globalKey) }]}
      title={GLOBAL_LABEL(globalKey)}
      docKey={locale}
      previewPath={globalUrl(globalKey, locale)}
    >
      {entries.map(([k, v]) => (
        <Field
          key={`${locale}:${k}`}
          name={k}
          value={v}
          reference={entries.length === 1 && k === globalKey ? reference : asObject(reference)[k]}
          path={entries.length === 1 && k === globalKey ? [globalKey] : [globalKey, k]}
          onChange={edit(locale)}
          ctx={ctx}
          depth={1}
        />
      ))}
    </DocumentView>
  );
}

const SITEWIDE = ["director", "structure", "team", "video"];

/** The switches that hide sections everywhere (the home page's own are in the page builder). */
export function SettingsEdit() {
  const { docs, edit } = useCms();
  const sections = asObject(asObject(docs.settings?.draft).sections);
  return (
    <DocumentView crumbs={[{ label: "العامة", route: { name: "dashboard" } }, { label: "إظهار الأقسام" }]} title="إظهار الأقسام" docKey="settings" localized={false}>
      <p className={small}>
        إخفاء هذه الأقسام من كل صفحات الموقع، في اللغتين. لإظهار أقسام الصفحة الرئيسية أو إخفائها وترتيبها استخدم منشئ الصفحات (رمز العين).
      </p>
      <div className={`${card} flex flex-col gap-1`}>
        {SITEWIDE.map((k) => (
          <label key={k} className="flex cursor-pointer items-center gap-3 py-1.5">
            <input type="checkbox" className="h-4 w-4 accent-navy" checked={sections[k] !== false} onChange={(e) => edit("settings")(["sections", k], e.target.checked)} />
            <span className="text-[15px] text-navy">{SECTION_LABELS[k] ?? k}</span>
          </label>
        ))}
      </div>
    </DocumentView>
  );
}

interface Recent {
  id: number;
  version: number;
  note: string;
  createdAt: string;
  author: string | null;
  key: DocKey;
}

/** The start screen: pages, collections with their counts, globals, and the latest edits. */
export function Dashboard() {
  const { docs, go, me, onError } = useCms();
  const [recent, setRecent] = useState<Recent[] | null>(null);
  const draft = docs.ar?.draft;
  const pages = asList(asObject(draft).customPages);

  useEffect(() => {
    let live = true;
    Promise.all(
      (["ar", "en", "settings"] as DocKey[]).map((key) =>
        api<{ revisions: Omit<Recent, "key">[] }>(`/api/admin/revisions?key=${key}`).then((r) => r.revisions.slice(0, 6).map((x) => ({ ...x, key }))),
      ),
    )
      .then((lists) => live && setRecent(lists.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)))
      .catch(onError);
    return () => {
      live = false;
    };
  }, [onError]);

  const tile = "flex cursor-pointer flex-col gap-1 border border-border-soft bg-white p-4 text-start hover:border-navy";
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 p-5 md:p-8">
        <div>
          <p className={small}>مرحبًا {me.name}</p>
          <h1 className="text-[26px] font-bold text-navy">لوحة التحكم</h1>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-[16px] font-bold text-navy">الصفحات</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" className={`${tile} border-s-4 border-s-gold`} onClick={() => go({ name: "builder", page: "home" })}>
              <span className="text-[15px] font-bold text-navy">الصفحة الرئيسية</span>
              <span className={small}>رتّب الأقسام وعدّلها مباشرة على المعاينة</span>
            </button>
            {pages.map((p) => {
              const page = asObject(p);
              return (
                <button key={String(page.slug)} type="button" className={tile} onClick={() => go({ name: "builder", page: String(page.slug) })}>
                  <span className="text-[15px] font-bold text-navy">{String(page.title || page.slug)}</span>
                  <span className={small} dir="ltr">
                    /{String(page.slug)}
                  </span>
                </button>
              );
            })}
            <button type="button" className={`${tile} items-center justify-center border-dashed`} onClick={() => go({ name: "builder", page: "new" })}>
              <span className="text-[15px] font-bold text-navy">+ صفحة جديدة</span>
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[16px] font-bold text-navy">المجموعات</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLLECTIONS.map((c) => (
              <button key={c.id} type="button" className={tile} onClick={() => go({ name: "collection", id: c.id })}>
                <span className="text-[15px] font-bold text-navy">{c.label}</span>
                <span className={small}>{itemsOf(draft, c).length} عنصر</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-[16px] font-bold text-navy">العامة</h2>
            <div className={`${card} flex flex-wrap gap-2`}>
              {GLOBAL_GROUPS.flatMap((g) => g.keys).map((k) => (
                <button key={k} type="button" className={btn} onClick={() => go({ name: "global", key: k })}>
                  {GLOBAL_LABEL(k)}
                </button>
              ))}
              <button type="button" className={btn} onClick={() => go({ name: "global", key: "settings" })}>
                إظهار الأقسام
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-[16px] font-bold text-navy">آخر التعديلات</h2>
            <div className={`${card} flex flex-col`}>
              {recent === null ? <p className={small}>جارٍ التحميل…</p> : null}
              {recent?.map((r) => (
                <div key={`${r.key}-${r.id}`} className="flex items-center justify-between gap-2 border-b border-border-soft py-2 last:border-0">
                  <span className="min-w-0 truncate text-[13px] text-navy">
                    {DOC_LABELS[r.key]} · {r.note || `النسخة ${r.version}`}
                  </span>
                  <span className="shrink-0 text-[12px] text-muted">
                    {r.author ?? "—"} · {formatDate(r.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export { GLOBAL_LABEL, type Path };
