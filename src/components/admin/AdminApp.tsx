"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Account } from "./Account";
import { HomeBlocksView, PagesView } from "./Builder";
import { Field, getAt, pathKey, setAt, type EditorContext, type Path } from "./Editor";
import { DOC_LABELS, History } from "./History";
import { MediaLibrary } from "./MediaLibrary";
import { Search, type SearchHit } from "./Search";
import { Users } from "./Users";
import { Conflict, Unauthorized, api, errorText, formatDate, type DocKey, type Json, type Me } from "./api";
import { BUILDER_KEYS, SECTION_LABELS, labelFor } from "./labels";
import { btn, input, primary, secondary, small } from "./ui";

interface Doc {
  saved: Json;
  draft: Json;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
}

interface Loaded {
  data: Json;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
}

type Locale = "ar" | "en";
type View =
  | { type: "content"; section: string }
  | { type: "pages" }
  | { type: "home" }
  | { type: "settings" }
  | { type: "media" }
  | { type: "history" }
  | { type: "users" }
  | { type: "account" };

type Phase = "loading" | "unconfigured" | "setup" | "signin" | "ready";
type Obj = { [k: string]: Json };

/** One step of undo: a document's draft before an edit. */
interface Step {
  key: DocKey;
  draft: Json;
  /** Where and when the edit happened, so typing in one field undoes as one step. */
  at: string;
  time: number;
}

const LOCALES: { key: Locale; label: string }[] = [
  { key: "ar", label: "العربية" },
  { key: "en", label: "English" },
];
const DOC_KEYS: DocKey[] = ["ar", "en", "settings"];

const asObject = (v: Json | undefined): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const same = (a: Json | undefined, b: Json | undefined) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The content admin at /admin.
 *
 * Content lives in the database as three documents: the Arabic and the
 * English content, and the section switches. Editors pick a section, edit
 * it in either language (the Arabic text is shown under each English field
 * as a reference), and save; the site re-renders right away.
 *
 * Beyond the built-in sections, editors create their own pages and add
 * blocks to the home page, choosing how each block is displayed (Builder),
 * format paragraphs (RichEditor), search everything (Search), undo and redo
 * every change, revert one section, and restore whole documents or single
 * sections from the history. Admins also manage accounts.
 */
export default function AdminApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [docs, setDocs] = useState<Partial<Record<DocKey, Doc>>>({});
  const [view, setView] = useState<View>({ type: "content", section: "hero" });
  const [locale, setLocale] = useState<Locale>("ar");
  const [page, setPage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<DocKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ path: Path; nonce: number } | null>(null);
  const [past, setPast] = useState<Step[]>([]);
  const [future, setFuture] = useState<Step[]>([]);
  const docsRef = useRef(docs);
  docsRef.current = docs;

  /** Sends the editor back to sign-in when the session has ended. */
  const onUnauthorized = useCallback((e: unknown) => {
    if (e instanceof Unauthorized) {
      setPhase("signin");
      return true;
    }
    return false;
  }, []);
  const onError = useCallback(
    (e: unknown) => {
      if (!onUnauthorized(e)) setError(errorText(e));
    },
    [onUnauthorized],
  );

  const loadDoc = async (key: DocKey): Promise<Doc> => {
    const d = await api<Loaded>(`/api/admin/content?key=${key}`);
    return { saved: d.data, draft: d.data, version: d.version, updatedAt: d.updatedAt, updatedBy: d.updatedBy };
  };

  const start = useCallback(async () => {
    setError(null);
    try {
      const s = await api<{ configured: boolean; needsSetup: boolean; user: Me | null }>("/api/admin/session");
      if (!s.configured) return setPhase("unconfigured");
      if (s.needsSetup) return setPhase("setup");
      if (!s.user) return setPhase("signin");
      setMe(s.user);
      const [ar, en, settings] = await Promise.all([loadDoc("ar"), loadDoc("en"), loadDoc("settings")]);
      setDocs({ ar, en, settings });
      setPast([]);
      setFuture([]);
      setPhase("ready");
    } catch (e) {
      if (!onUnauthorized(e)) {
        setError(errorText(e));
        setPhase((p) => (p === "loading" ? "signin" : p));
      }
    }
  }, [onUnauthorized]);

  useEffect(() => {
    const t = setTimeout(() => void start(), 0);
    return () => clearTimeout(t);
  }, [start]);

  const isDirty = useCallback(
    (key: DocKey) => {
      const d = docs[key];
      return d ? !same(d.draft, d.saved) : false;
    },
    [docs],
  );
  const dirtyKeys = DOC_KEYS.filter(isDirty);
  const anyDirty = dirtyKeys.length > 0;

  /* Warn before leaving the page with unsaved changes. */
  useEffect(() => {
    if (!anyDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty]);

  const sections = useMemo(() => Object.keys(asObject(docs.ar?.draft)).filter((k) => !BUILDER_KEYS.has(k)), [docs.ar?.draft]);

  /** Replaces a document's draft, recording the previous one for undo. */
  const commit = useCallback((key: DocKey, next: (draft: Json) => Json, at = "") => {
    const cur = docsRef.current[key];
    if (!cur) return;
    const draft = next(cur.draft);
    if (same(draft, cur.draft)) return;
    const now = Date.now();
    setPast((p) => {
      const last = p[p.length - 1];
      /* Keystrokes in the same field within a second are one undo step. */
      if (at && last && last.key === key && last.at === at && now - last.time < 1000) return [...p.slice(0, -1), { ...last, time: now }];
      return [...p.slice(-199), { key, draft: cur.draft, at, time: now }];
    });
    setFuture([]);
    setDocs((d) => ({ ...d, [key]: { ...cur, draft } }));
  }, []);

  const edit = (key: DocKey) => (path: Path, value: Json) => commit(key, (draft) => setAt(draft, path, value), pathKey(path));

  const undo = useCallback(() => {
    const step = past[past.length - 1];
    const cur = step && docsRef.current[step.key];
    if (!step || !cur) return;
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [...f, { ...step, draft: cur.draft }]);
    setDocs((d) => ({ ...d, [step.key]: { ...cur, draft: step.draft } }));
  }, [past]);

  const redo = useCallback(() => {
    const step = future[future.length - 1];
    const cur = step && docsRef.current[step.key];
    if (!step || !cur) return;
    setFuture((f) => f.slice(0, -1));
    setPast((p) => [...p, { ...step, draft: cur.draft }]);
    setDocs((d) => ({ ...d, [step.key]: { ...cur, draft: step.draft } }));
  }, [future]);

  /* Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z or Ctrl+Y redoes, except inside a
     formatted-text editor, which keeps the browser's own undo. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement | null)?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /** Saves every document with changes, one after another. */
  const saveAll = async () => {
    setBusy("جارٍ الحفظ…");
    setError(null);
    setNotice(null);
    setConflict(null);
    try {
      for (const key of DOC_KEYS) {
        const doc = docsRef.current[key];
        if (!doc || same(doc.draft, doc.saved)) continue;
        const before = asObject(doc.saved);
        const after = asObject(doc.draft);
        const changed = Object.keys(after).filter((k) => !same(after[k], before[k]));
        const note = changed.map((k) => (k === "customPages" ? "الصفحات" : k === "homeBlocks" ? "أقسام إضافية في الرئيسية" : SECTION_LABELS[k] ?? k)).join("، ");
        try {
          const saved = await api<{ version: number; updatedAt: string; updatedBy: string; data: Json }>("/api/admin/content", {
            method: "PUT",
            body: JSON.stringify({ key, data: doc.draft, version: doc.version, note }),
          });
          /* The server returns the content as stored (formatting cleaned up). */
          setDocs((d) => {
            const cur = d[key] ?? doc;
            const untouched = same(cur.draft, doc.draft);
            return { ...d, [key]: { ...cur, saved: saved.data, draft: untouched ? saved.data : cur.draft, version: saved.version, updatedAt: saved.updatedAt, updatedBy: saved.updatedBy } };
          });
        } catch (e) {
          if (e instanceof Conflict) {
            setConflict(key);
            throw new Error(`${DOC_LABELS[key]}: ${e.message} لن يُحفظ حتى تحمّل أحدث نسخة.`);
          }
          throw e;
        }
      }
      setNotice("تم الحفظ، والتغيير ظاهر على الموقع الآن.");
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  };

  const discardAll = () => {
    if (!window.confirm("تجاهل كل التعديلات غير المحفوظة؟")) return;
    for (const key of dirtyKeys) commit(key, () => docsRef.current[key]?.saved ?? null);
  };

  const reloadLatest = async (key: DocKey) => {
    try {
      const fresh = await loadDoc(key);
      setDocs((d) => ({ ...d, [key]: fresh }));
      setPast((p) => p.filter((s) => s.key !== key));
      setFuture((f) => f.filter((s) => s.key !== key));
      setConflict(null);
      setError(null);
      setNotice("حُمّلت أحدث نسخة. أعد تعديلاتك عليها ثم احفظ.");
    } catch (e) {
      onError(e);
    }
  };

  const restore = async (key: DocKey, revisionId: number) => {
    const doc = docs[key];
    if (!doc) return;
    setError(null);
    try {
      const r = await api<Loaded>("/api/admin/revisions", {
        method: "POST",
        body: JSON.stringify({ id: revisionId, version: doc.version }),
      });
      setDocs((d) => ({ ...d, [key]: { saved: r.data, draft: r.data, version: r.version, updatedAt: r.updatedAt, updatedBy: r.updatedBy } }));
      setPast((p) => p.filter((s) => s.key !== key));
      setFuture((f) => f.filter((s) => s.key !== key));
      setNotice("تمت الاستعادة، والمحتوى المستعاد ظاهر على الموقع الآن.");
    } catch (e) {
      if (e instanceof Conflict) {
        setConflict(key);
        setError(e.message);
      } else onError(e);
    }
  };

  /** Puts one section of an old version back into the draft, to review and save. */
  const revertSection = (key: DocKey, section: string, value: Json) => {
    commit(key, (draft) => setAt(draft, [section], value));
    if (key !== "settings") {
      setLocale(key);
      go(section === "customPages" ? { type: "pages" } : section === "homeBlocks" ? { type: "home" } : { type: "content", section });
    } else go({ type: "settings" });
    setNotice("استُرجع القسم في المسودة. راجعه ثم اضغط «حفظ ونشر»، أو تراجع عنه.");
  };

  const signOut = async () => {
    if (anyDirty && !window.confirm("لديك تعديلات غير محفوظة ستُفقد. تسجيل الخروج؟")) return;
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
    setDocs({});
    setMe(null);
    setPhase("signin");
  };

  function go(next: View) {
    setView(next);
    setNotice(null);
    if (!conflict) setError(null);
  }

  /* After the search jumps somewhere, scroll to the field and focus it. */
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-path='${pathKey(focus.path).replace(/'/g, "\\'")}']`);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("ring-2", "ring-gold");
      setTimeout(() => el.classList.remove("ring-2", "ring-gold"), 2200);
      (el.querySelector("input, textarea, [contenteditable]") as HTMLElement | null)?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(t);
  }, [focus]);

  const jump = (hit: SearchHit) => {
    setLocale(hit.locale);
    const [first, second] = hit.path;
    if (first === "customPages") {
      const slug = asObject((asObject(docs[hit.locale]?.draft).customPages as Json[] | undefined)?.[second as number]).slug;
      setPage(typeof slug === "string" ? slug : null);
      go({ type: "pages" });
    } else if (first === "homeBlocks") go({ type: "home" });
    else go({ type: "content", section: String(first) });
    setFocus({ path: hit.path, nonce: Date.now() });
  };

  if (phase === "loading") return <Splash text="جارٍ التحميل…" />;
  if (phase === "unconfigured") {
    return (
      <Splash text="لوحة التحكم غير مهيأة على هذا الخادم: لا توجد قاعدة بيانات (DATABASE_URL). يعرض الموقع المحتوى المضمّن فيه." />
    );
  }
  if (phase === "setup") return <Setup onDone={() => void start()} />;
  if (phase === "signin" || !me) return <SignIn onSignedIn={() => void start()} />;

  const contentKey: DocKey = locale;
  const ctx: EditorContext = {
    dir: locale === "ar" ? "rtl" : "ltr",
    referenceLabel: locale === "en" ? "العربية" : undefined,
    focus: focus?.path,
  };
  const builderDirty = (k: string) => (["ar", "en"] as const).some((l) => !same(asObject(docs[l]?.draft)[k], asObject(docs[l]?.saved)[k]));
  const build: { view: View; label: string; dirty?: boolean }[] = [
    { view: { type: "pages" }, label: "الصفحات", dirty: builderDirty("customPages") },
    { view: { type: "home" }, label: "أقسام إضافية في الرئيسية", dirty: builderDirty("homeBlocks") },
    { view: { type: "settings" }, label: "إظهار الأقسام", dirty: isDirty("settings") },
  ];
  const nav: { view: View; label: string; dirty?: boolean }[] = [
    { view: { type: "media" }, label: "مكتبة الوسائط" },
    { view: { type: "history" }, label: "سجل التعديلات" },
    ...(me.role === "admin" ? [{ view: { type: "users" } as View, label: "المستخدمون" }] : []),
    { view: { type: "account" }, label: "حسابي" },
  ];
  const sectionDirty = (k: string) => builderDirty(k);
  const current = view.type === "content" && sections.includes(view.section) ? view.section : sections[0];
  const viewKey = view.type === "content" ? `content:${current}` : view.type;
  const showsLocales = view.type === "content" || view.type === "pages" || view.type === "home";
  const currentSectionDirty =
    view.type === "content" && current ? !same(asObject(docs[contentKey]?.draft)[current], asObject(docs[contentKey]?.saved)[current]) : false;

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-soft bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-0.5 w-6 shrink-0 bg-gold" />
          <span className="hidden truncate text-[15px] font-bold text-navy lg:inline">لوحة تحكم المحتوى</span>
          <a href={`/${locale}`} target="_blank" rel="noreferrer" className="hidden shrink-0 text-[13px] text-muted underline hover:text-navy sm:inline">
            فتح الموقع
          </a>
        </div>
        <Search docs={{ ar: docs.ar?.draft, en: docs.en?.draft }} onPick={jump} />
        <div className="flex shrink-0 items-center gap-3 text-[13px]">
          <span className="hidden text-muted xl:inline">{me.name}</span>
          <button type="button" onClick={() => void signOut()} className="cursor-pointer text-muted underline hover:text-navy">
            تسجيل الخروج
          </button>
        </div>
      </header>

      {/* Phones: one menu instead of the sidebar. */}
      <div className="border-b border-border-soft bg-white p-2 md:hidden">
        <select
          className={input}
          value={viewKey}
          onChange={(e) => {
            const v = e.target.value;
            go(v.startsWith("content:") ? { type: "content", section: v.slice(8) } : ({ type: v } as View));
          }}
        >
          <optgroup label="المحتوى">
            {sections.map((k) => (
              <option key={k} value={`content:${k}`}>
                {SECTION_LABELS[k] ?? k}
                {sectionDirty(k) ? " •" : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label="البناء">
            {build.map((n) => (
              <option key={n.view.type} value={n.view.type}>
                {n.label}
                {n.dirty ? " •" : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label="الإدارة">
            {nav.map((n) => (
              <option key={n.view.type} value={n.view.type}>
                {n.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-60 shrink-0 overflow-y-auto border-e border-border-soft bg-white py-2 md:block">
          <p className="px-4 pb-1 pt-2 text-[12px] font-bold text-muted">البناء</p>
          {build.map((n) => (
            <NavButton key={n.view.type} active={view.type === n.view.type} dirty={n.dirty} onClick={() => go(n.view)}>
              {n.label}
            </NavButton>
          ))}
          <p className="mt-3 border-t border-border-soft px-4 pb-1 pt-3 text-[12px] font-bold text-muted">المحتوى</p>
          {sections.map((k) => (
            <NavButton
              key={k}
              active={view.type === "content" && current === k}
              dirty={sectionDirty(k)}
              onClick={() => go({ type: "content", section: k })}
            >
              {SECTION_LABELS[k] ?? k}
            </NavButton>
          ))}
          <p className="mt-3 border-t border-border-soft px-4 pb-1 pt-3 text-[12px] font-bold text-muted">الإدارة</p>
          {nav.map((n) => (
            <NavButton key={n.view.type} active={view.type === n.view.type} dirty={n.dirty} onClick={() => go(n.view)}>
              {n.label}
            </NavButton>
          ))}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto">
          {/* The save bar: always in reach, for every document with changes. */}
          <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-border-soft bg-white/95 px-4 py-2 backdrop-blur md:px-6">
            <span className="text-[13px] text-muted">
              {anyDirty ? `تعديلات غير محفوظة في: ${dirtyKeys.map((k) => DOC_LABELS[k]).join("، ")}` : "لا توجد تعديلات غير محفوظة"}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <button type="button" className={btn} onClick={undo} disabled={!past.length} title="تراجع (Ctrl+Z)">
                ↶ تراجع
              </button>
              <button type="button" className={btn} onClick={redo} disabled={!future.length} title="إعادة (Ctrl+Shift+Z)">
                ↷ إعادة
              </button>
              <button type="button" onClick={discardAll} disabled={!anyDirty || !!busy} className={`${secondary} h-9`}>
                تجاهل الكل
              </button>
              <button type="button" onClick={() => void saveAll()} disabled={!anyDirty || !!busy} className={`${primary} h-9`}>
                {busy ?? "حفظ ونشر"}
              </button>
            </span>
          </div>

          <div className="p-4 md:p-6">
            <div className="mx-auto mb-4 flex max-w-[1100px] flex-col gap-2">
              {error ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border border-danger/40 bg-white p-3 text-[14px] text-danger">
                  <span>{error}</span>
                  {conflict ? (
                    <button type="button" className={`${secondary} h-8`} onClick={() => void reloadLatest(conflict)}>
                      تحميل أحدث نسخة
                    </button>
                  ) : null}
                </div>
              ) : null}
              {notice ? <p className="border border-border-soft bg-white p-3 text-[14px] text-navy">{notice}</p> : null}
            </div>

            {showsLocales ? (
              <div className="mx-auto mb-4 flex max-w-[860px] gap-1 border-b border-border-soft">
                {LOCALES.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setLocale(l.key)}
                    className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-[14px] ${
                      locale === l.key ? "border-gold font-bold text-navy" : "border-transparent text-muted hover:text-navy"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {l.label}
                      {isDirty(l.key) ? <span className="h-2 w-2 rounded-full bg-gold" aria-label="تعديلات غير محفوظة" /> : null}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {view.type === "content" && current ? (
              <div className="mx-auto flex max-w-[860px] flex-col gap-4">
                <EditorHeader title={labelFor(current)} id={current} doc={docs[contentKey]}>
                  <button
                    type="button"
                    className={btn}
                    disabled={!currentSectionDirty}
                    title="إرجاع هذا القسم في هذه اللغة إلى آخر نسخة محفوظة"
                    onClick={() => commit(contentKey, (draft) => setAt(draft, [current], getAt(docs[contentKey]?.saved, [current]) ?? null))}
                  >
                    استرجاع القسم
                  </button>
                </EditorHeader>
                {docs[contentKey] ? (
                  <Field
                    key={`${locale}:${current}`}
                    name={current}
                    value={asObject(docs[contentKey]?.draft)[current] ?? null}
                    reference={locale === "en" ? asObject(docs.ar?.draft)[current] : undefined}
                    path={[current]}
                    onChange={edit(contentKey)}
                    ctx={ctx}
                  />
                ) : null}
              </div>
            ) : null}

            {view.type === "pages" ? (
              <PagesView
                drafts={{ ar: docs.ar?.draft, en: docs.en?.draft }}
                locale={locale}
                selected={page}
                onSelect={setPage}
                onEdit={edit(contentKey)}
                mutate={(change) => (["ar", "en"] as const).forEach((l) => commit(l, (draft) => change(asObject(draft), l)))}
                ctx={ctx}
              />
            ) : null}

            {view.type === "home" ? (
              <HomeBlocksView draft={docs[contentKey]?.draft} reference={docs.ar?.draft} locale={locale} onEdit={edit(contentKey)} ctx={ctx} />
            ) : null}

            {view.type === "settings" ? (
              <div className="mx-auto flex max-w-[860px] flex-col gap-4">
                <EditorHeader title="إظهار الأقسام" id="settings" doc={docs.settings} />
                <p className={small}>
                  أوقف أي قسم لإخفائه من الصفحة الرئيسية في اللغتين. كلمة المدير والهيكلية والفريق والفيديو تختفي من كل الصفحات، وتسقط روابط
                  القائمة إليها.
                </p>
                {docs.settings ? (
                  <Field
                    name="sections"
                    value={asObject(docs.settings.draft).sections ?? {}}
                    path={["sections"]}
                    onChange={edit("settings")}
                    ctx={{ dir: "rtl" }}
                  />
                ) : null}
              </div>
            ) : null}

            {view.type === "media" ? <MediaLibrary onUnauthorized={onUnauthorized} /> : null}
            {view.type === "history" ? (
              <History
                current={{ ar: docs.ar, en: docs.en, settings: docs.settings }}
                dirty={isDirty}
                onRestore={restore}
                onRevertSection={revertSection}
                onError={onError}
              />
            ) : null}
            {view.type === "users" && me.role === "admin" ? <Users me={me} onError={onError} /> : null}
            {view.type === "account" ? <Account me={me} onRenamed={(name) => setMe({ ...me, name })} onError={onError} /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavButton({
  active,
  dirty,
  onClick,
  children,
}: {
  active: boolean;
  dirty?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-start text-[14px] ${
        active ? "bg-surface font-bold text-navy" : "text-body hover:bg-surface/60"
      }`}
    >
      <span>{children}</span>
      {dirty ? <span className="h-2 w-2 rounded-full bg-gold" aria-label="تعديلات غير محفوظة" /> : null}
    </button>
  );
}

function EditorHeader({ title, id, doc, children }: { title: string; id: string; doc: Doc | undefined; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold text-navy">
          {title}{" "}
          <span dir="ltr" className="text-[13px] font-normal text-muted">
            {id}
          </span>
        </h1>
        {doc ? (
          <span className={small}>
            آخر حفظ: {formatDate(doc.updatedAt)}
            {doc.updatedBy ? ` · ${doc.updatedBy}` : ""} · النسخة {doc.version}
          </span>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}

function Splash({ text }: { text: string }) {
  return <div className="flex min-h-dvh items-center justify-center bg-navy px-6 text-center text-[15px] text-pale">{text}</div>;
}

function AuthCard({ title, note, children, onSubmit }: { title: string; note?: string; children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy px-5">
      <form onSubmit={onSubmit} className="flex w-full max-w-[420px] flex-col gap-4 border-s-4 border-gold bg-white p-6">
        <div>
          <p className="text-[12px] tracking-[2px] text-muted">UOWA · الحاسبة الإلكترونية</p>
          <h1 className="mt-1 text-[22px] font-bold text-navy">{title}</h1>
          {note ? <p className="mt-2 text-[13px] leading-6 text-muted">{note}</p> : null}
        </div>
        {children}
      </form>
    </div>
  );
}

function TextInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] text-muted">{label}</span>
      <input {...props} className="h-11 w-full border border-border-soft px-3 text-[15px] text-navy outline-none focus:border-navy" />
    </label>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/session", { method: "POST", body: JSON.stringify({ email, password }) });
      setPassword("");
      onSignedIn();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="لوحة تحكم المحتوى" onSubmit={(e) => void submit(e)}>
      <TextInput label="البريد الإلكتروني" type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <TextInput label="كلمة المرور" type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      <button type="submit" disabled={busy || !email || !password} className={`${primary} h-11`}>
        {busy ? "جارٍ الدخول…" : "دخول"}
      </button>
    </AuthCard>
  );
}

function Setup({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/setup", { method: "POST", body: JSON.stringify(form) });
      onDone();
    } catch (err) {
      setError(errorText(err));
      if (err instanceof Conflict) setTimeout(onDone, 1500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="إنشاء حساب المدير"
      note="أول تشغيل للوحة التحكم: أنشئ حساب المدير الأول. يمكنك بعدها إضافة حسابات للمحررين من «المستخدمون»."
      onSubmit={(e) => void submit(e)}
    >
      <TextInput label="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <TextInput label="البريد الإلكتروني" type="email" dir="ltr" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <TextInput
        label="كلمة المرور (10 أحرف على الأقل)"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        minLength={10}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      <button type="submit" disabled={busy} className={`${primary} h-11`}>
        {busy ? "جارٍ الإنشاء…" : "إنشاء الحساب والدخول"}
      </button>
    </AuthCard>
  );
}
