"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Conflict, Unauthorized, api, errorText, type DocKey, type Json, type Me } from "./api";
import { pathKey, setAt, type Path } from "./Editor";
import { DOC_LABELS } from "./History";
import { SECTION_LABELS } from "./labels";

/**
 * The admin's working state, shared by every screen: the three content
 * documents (published copy and the editor's draft of each), the language
 * being edited, undo/redo, saving, and the current screen.
 */

export interface Doc {
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

export type Locale = "ar" | "en";
export type Obj = { [k: string]: Json };

export type Route =
  | { name: "dashboard" }
  | { name: "builder"; page?: string }
  | { name: "collection"; id: string }
  | { name: "item"; id: string; index: number }
  | { name: "global"; key: string }
  | { name: "media" }
  | { name: "history" }
  | { name: "users" }
  | { name: "account" };

interface Step {
  key: DocKey;
  draft: Json;
  at: string;
  time: number;
}

export const DOC_KEYS: DocKey[] = ["ar", "en", "settings"];
export const asObject = (v: Json | undefined): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
export const asList = (v: Json | undefined): Json[] => (Array.isArray(v) ? v : []);
export const same = (a: Json | undefined, b: Json | undefined) => JSON.stringify(a) === JSON.stringify(b);

interface Cms {
  me: Me;
  setMe: (me: Me) => void;
  docs: Partial<Record<DocKey, Doc>>;
  locale: Locale;
  setLocale: (l: Locale) => void;
  route: Route;
  go: (route: Route) => void;
  /** Edits one value of a document's draft (one undo step per field while typing). */
  edit: (key: DocKey) => (path: Path, value: Json) => void;
  /** Replaces a document's draft. */
  commit: (key: DocKey, next: (draft: Json) => Json, at?: string) => void;
  /** Applies the same structural change to both languages (add, delete, move…). */
  both: (change: (draft: Obj, locale: Locale) => Obj) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  dirtyKeys: DocKey[];
  isDirty: (key: DocKey) => boolean;
  saveAll: () => Promise<void>;
  discardAll: () => void;
  busy: string | null;
  error: string | null;
  notice: string | null;
  conflict: DocKey | null;
  setNotice: (n: string | null) => void;
  /** Closes the current message, error or notice. */
  dismiss: () => void;
  onError: (e: unknown) => void;
  reloadLatest: (key: DocKey) => Promise<void>;
  restore: (key: DocKey, revisionId: number) => Promise<void>;
  revertSection: (key: DocKey, section: string, value: Json) => void;
  /** Ask the shell to jump to a field (search results, preview clicks). */
  focus: { path: Path; nonce: number } | null;
  setFocus: (path: Path | null) => void;
}

const CmsContext = createContext<Cms | null>(null);

export function useCms(): Cms {
  const value = useContext(CmsContext);
  if (!value) throw new Error("useCms outside CmsProvider");
  return value;
}

export function CmsProvider({
  me: initialMe,
  initialDocs,
  onSignedOut,
  children,
}: {
  me: Me;
  initialDocs: Record<DocKey, Doc>;
  onSignedOut: () => void;
  children: React.ReactNode;
}) {
  const [me, setMe] = useState(initialMe);
  const [docs, setDocs] = useState<Partial<Record<DocKey, Doc>>>(initialDocs);
  const [locale, setLocale] = useState<Locale>("ar");
  const [route, setRoute] = useState<Route>({ name: "dashboard" });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflict, setConflict] = useState<DocKey | null>(null);
  const [past, setPast] = useState<Step[]>([]);
  const [future, setFuture] = useState<Step[]>([]);
  const [focus, setFocusState] = useState<{ path: Path; nonce: number } | null>(null);
  const docsRef = useRef(docs);
  useEffect(() => {
    docsRef.current = docs;
  }, [docs]);

  const onError = useCallback(
    (e: unknown) => {
      if (e instanceof Unauthorized) onSignedOut();
      else setError(errorText(e));
    },
    [onSignedOut],
  );

  const go = useCallback(
    (next: Route) => {
      setRoute(next);
      setNotice(null);
      if (!conflict) setError(null);
    },
    [conflict],
  );

  const commit = useCallback((key: DocKey, next: (draft: Json) => Json, at = "") => {
    const cur = docsRef.current[key];
    if (!cur) return;
    const draft = next(cur.draft);
    if (same(draft, cur.draft)) return;
    const now = Date.now();
    setPast((p) => {
      const last = p[p.length - 1];
      if (at && last && last.key === key && last.at === at && now - last.time < 1000) return [...p.slice(0, -1), { ...last, time: now }];
      return [...p.slice(-199), { key, draft: cur.draft, at, time: now }];
    });
    setFuture([]);
    const updated = { ...cur, draft };
    docsRef.current = { ...docsRef.current, [key]: updated };
    setDocs((d) => ({ ...d, [key]: updated }));
  }, []);

  const edit = useCallback((key: DocKey) => (path: Path, value: Json) => commit(key, (draft) => setAt(draft, path, value), pathKey(path)), [commit]);

  const both = useCallback(
    (change: (draft: Obj, locale: Locale) => Obj) => {
      (["ar", "en"] as const).forEach((l) => commit(l, (draft) => change(asObject(draft), l)));
    },
    [commit],
  );

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

  const saveRef = useRef<() => Promise<void>>(async () => {});

  /* Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z or Ctrl+Y redoes, Ctrl/Cmd+S saves (formatted-text editors keep the browser's own undo). */
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
      } else if (k === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const isDirty = useCallback((key: DocKey) => {
    const d = docs[key];
    return d ? !same(d.draft, d.saved) : false;
  }, [docs]);
  const dirtyKeys = useMemo(() => DOC_KEYS.filter(isDirty), [isDirty]);

  useEffect(() => {
    if (!dirtyKeys.length) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyKeys.length]);

  const saveAll = useCallback(async () => {
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
        const note = changed
          .map((k) => (k === "customPages" ? "الصفحات" : k === "homeLayout" ? "تخطيط الرئيسية" : k === "homeBlocks" ? "أقسام إضافية" : SECTION_LABELS[k] ?? k))
          .join("، ");
        try {
          const saved = await api<{ version: number; updatedAt: string; updatedBy: string; data: Json }>("/api/admin/content", {
            method: "PUT",
            body: JSON.stringify({ key, data: doc.draft, version: doc.version, note }),
          });
          setDocs((d) => {
            const cur = d[key] ?? doc;
            const untouched = same(cur.draft, doc.draft);
            const next = { ...cur, saved: saved.data, draft: untouched ? saved.data : cur.draft, version: saved.version, updatedAt: saved.updatedAt, updatedBy: saved.updatedBy };
            docsRef.current = { ...docsRef.current, [key]: next };
            return { ...d, [key]: next };
          });
        } catch (e) {
          if (e instanceof Conflict) {
            setConflict(key);
            throw new Error(`${DOC_LABELS[key]}: ${e.message} لن يُحفظ حتى تحمّل أحدث نسخة.`);
          }
          throw e;
        }
      }
      setNotice("تم الحفظ والنشر، والتغيير ظاهر على الموقع الآن.");
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  }, [onError]);
  useEffect(() => {
    saveRef.current = saveAll;
  }, [saveAll]);

  const discardAll = useCallback(() => {
    if (!window.confirm("تجاهل كل التعديلات غير المحفوظة؟")) return;
    for (const key of DOC_KEYS) {
      const doc = docsRef.current[key];
      if (doc && !same(doc.draft, doc.saved)) commit(key, () => doc.saved);
    }
  }, [commit]);

  const loadDoc = async (key: DocKey): Promise<Doc> => {
    const d = await api<Loaded>(`/api/admin/content?key=${key}`);
    return { saved: d.data, draft: d.data, version: d.version, updatedAt: d.updatedAt, updatedBy: d.updatedBy };
  };

  const reloadLatest = useCallback(async (key: DocKey) => {
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
  }, [onError]);

  const restore = useCallback(
    async (key: DocKey, revisionId: number) => {
      const doc = docsRef.current[key];
      if (!doc) return;
      setError(null);
      try {
        const r = await api<Loaded>("/api/admin/revisions", { method: "POST", body: JSON.stringify({ id: revisionId, version: doc.version }) });
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
    },
    [onError],
  );

  const revertSection = useCallback(
    (key: DocKey, section: string, value: Json) => {
      commit(key, (draft) => setAt(draft, [section], value));
      if (key === "settings") go({ name: "global", key: "settings" });
      else {
        setLocale(key);
        go(section === "customPages" || section === "homeLayout" ? { name: "builder" } : { name: "global", key: section });
      }
      setNotice("استُرجع القسم في المسودة. راجعه ثم احفظ، أو تراجع عنه.");
    },
    [commit, go],
  );

  const setFocus = useCallback((path: Path | null) => setFocusState(path ? { path, nonce: Date.now() } : null), []);

  const value: Cms = {
    me,
    setMe,
    docs,
    locale,
    setLocale,
    route,
    go,
    edit,
    commit,
    both,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    dirtyKeys,
    isDirty,
    saveAll,
    discardAll,
    busy,
    error,
    notice,
    conflict,
    setNotice,
    dismiss: () => {
      setError(null);
      setNotice(null);
    },
    onError,
    reloadLatest,
    restore,
    revertSection,
    focus,
    setFocus,
  };
  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}
