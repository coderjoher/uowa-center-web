"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Account } from "./Account";
import { Field, setAt, type Path } from "./Editor";
import { History } from "./History";
import { MediaLibrary } from "./MediaLibrary";
import { Users } from "./Users";
import { Conflict, Unauthorized, api, errorText, formatDate, type DocKey, type Json, type Me } from "./api";
import { SECTION_LABELS, labelFor } from "./labels";
import { input, primary, secondary, small } from "./ui";

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
  | { type: "settings" }
  | { type: "media" }
  | { type: "history" }
  | { type: "users" }
  | { type: "account" };

type Phase = "loading" | "unconfigured" | "setup" | "signin" | "ready";

const LOCALES: { key: Locale; label: string }[] = [
  { key: "ar", label: "العربية" },
  { key: "en", label: "English" },
];

const asObject = (v: Json | undefined) => (v && typeof v === "object" && !Array.isArray(v) ? (v as { [k: string]: Json }) : {});
const same = (a: Json | undefined, b: Json | undefined) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The content admin at /admin.
 *
 * Content lives in the database as three documents: the Arabic and the
 * English content, and the section switches. Editors pick a section, edit
 * it in either language (the Arabic text is shown under each English field
 * as a reference), and save; the site re-renders right away. Every save is
 * kept in the history and can be restored. Pictures and videos come from
 * the media library. Admins also manage accounts.
 */
export default function AdminApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [docs, setDocs] = useState<Partial<Record<DocKey, Doc>>>({});
  const [view, setView] = useState<View>({ type: "content", section: "hero" });
  const [locale, setLocale] = useState<Locale>("ar");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<DocKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const isDirty = useCallback((key: DocKey) => {
    const d = docs[key];
    return d ? !same(d.draft, d.saved) : false;
  }, [docs]);
  const anyDirty = isDirty("ar") || isDirty("en") || isDirty("settings");

  /* Warn before leaving the page with unsaved changes. */
  useEffect(() => {
    if (!anyDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty]);

  const sections = useMemo(() => Object.keys(asObject(docs.ar?.draft)), [docs.ar?.draft]);

  const edit = (key: DocKey) => (path: Path, value: Json) =>
    setDocs((d) => {
      const cur = d[key];
      return cur ? { ...d, [key]: { ...cur, draft: setAt(cur.draft, path, value) } } : d;
    });

  const save = async (key: DocKey) => {
    const doc = docs[key];
    if (!doc) return;
    setBusy("جارٍ الحفظ…");
    setError(null);
    setNotice(null);
    setConflict(null);
    try {
      const before = asObject(doc.saved);
      const after = asObject(doc.draft);
      const changed = Object.keys(after).filter((k) => !same(after[k], before[k]));
      const note = changed.map((k) => SECTION_LABELS[k] ?? k).join("، ");
      const saved = await api<{ version: number; updatedAt: string; updatedBy: string }>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify({ key, data: doc.draft, version: doc.version, note }),
      });
      setDocs((d) => ({ ...d, [key]: { ...doc, saved: doc.draft, ...saved } }));
      setNotice("تم الحفظ، والتغيير ظاهر على الموقع الآن.");
    } catch (e) {
      if (e instanceof Conflict) {
        setConflict(key);
        setError(`${e.message} لن يُحفظ شيء حتى تحمّل أحدث نسخة.`);
      } else onError(e);
    } finally {
      setBusy(null);
    }
  };

  const discard = (key: DocKey) => {
    if (!window.confirm("تجاهل كل التعديلات غير المحفوظة في هذا المحتوى؟")) return;
    setDocs((d) => {
      const cur = d[key];
      return cur ? { ...d, [key]: { ...cur, draft: cur.saved } } : d;
    });
  };

  const reloadLatest = async (key: DocKey) => {
    try {
      const fresh = await loadDoc(key);
      setDocs((d) => ({ ...d, [key]: fresh }));
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
      setNotice("تمت الاستعادة، والمحتوى المستعاد ظاهر على الموقع الآن.");
    } catch (e) {
      if (e instanceof Conflict) {
        setConflict(key);
        setError(e.message);
      } else onError(e);
    }
  };

  const signOut = async () => {
    if (anyDirty && !window.confirm("لديك تعديلات غير محفوظة ستُفقد. تسجيل الخروج؟")) return;
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
    setDocs({});
    setMe(null);
    setPhase("signin");
  };

  const go = (next: View) => {
    setView(next);
    setNotice(null);
    if (!conflict) setError(null);
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
  const nav: { view: View; label: string; dirty?: boolean }[] = [
    { view: { type: "settings" }, label: "إظهار الأقسام", dirty: isDirty("settings") },
    { view: { type: "media" }, label: "مكتبة الوسائط" },
    { view: { type: "history" }, label: "سجل التعديلات" },
    ...(me.role === "admin" ? [{ view: { type: "users" } as View, label: "المستخدمون" }] : []),
    { view: { type: "account" }, label: "حسابي" },
  ];
  const sectionDirty = (k: string) =>
    (["ar", "en"] as const).some((l) => !same(asObject(docs[l]?.draft)[k], asObject(docs[l]?.saved)[k]));
  const current = view.type === "content" && sections.includes(view.section) ? view.section : sections[0];
  const viewKey = view.type === "content" ? `content:${current}` : view.type;

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-soft bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-0.5 w-6 shrink-0 bg-gold" />
          <span className="truncate text-[15px] font-bold text-navy">لوحة تحكم المحتوى</span>
          <a href={`/${locale}`} target="_blank" rel="noreferrer" className="shrink-0 text-[13px] text-muted underline hover:text-navy">
            فتح الموقع
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[13px]">
          <span className="hidden text-muted sm:inline">{me.name}</span>
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
          <optgroup label="الإدارة">
            {nav.map((n) => (
              <option key={n.view.type} value={n.view.type}>
                {n.label}
                {n.dirty ? " •" : ""}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-60 shrink-0 overflow-y-auto border-e border-border-soft bg-white py-2 md:block">
          <p className="px-4 pb-1 pt-2 text-[12px] font-bold text-muted">المحتوى</p>
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

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
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

          {view.type === "content" && current ? (
            <div className="mx-auto flex max-w-[860px] flex-col gap-4">
              <EditorHeader
                title={labelFor(current)}
                id={current}
                doc={docs[contentKey]}
                dirty={isDirty(contentKey)}
                busy={busy}
                onSave={() => void save(contentKey)}
                onDiscard={() => discard(contentKey)}
              />
              <div className="flex gap-1 border-b border-border-soft">
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
              {docs[contentKey] ? (
                <Field
                  key={`${locale}:${current}`}
                  name={current}
                  value={asObject(docs[contentKey]?.draft)[current] ?? null}
                  reference={locale === "en" ? asObject(docs.ar?.draft)[current] : undefined}
                  path={[current]}
                  onChange={edit(contentKey)}
                  ctx={{ dir: locale === "ar" ? "rtl" : "ltr", referenceLabel: locale === "en" ? "العربية" : undefined }}
                />
              ) : null}
            </div>
          ) : null}

          {view.type === "settings" ? (
            <div className="mx-auto flex max-w-[860px] flex-col gap-4">
              <EditorHeader
                title="إظهار الأقسام"
                id="settings"
                doc={docs.settings}
                dirty={isDirty("settings")}
                busy={busy}
                onSave={() => void save("settings")}
                onDiscard={() => discard("settings")}
              />
              <p className={small}>الأقسام المخفية لا تظهر في الصفحات ولا في القائمة، في اللغتين.</p>
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
              onError={onError}
            />
          ) : null}
          {view.type === "users" && me.role === "admin" ? <Users me={me} onError={onError} /> : null}
          {view.type === "account" ? <Account me={me} onRenamed={(name) => setMe({ ...me, name })} onError={onError} /> : null}
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

function EditorHeader({
  title,
  id,
  doc,
  dirty,
  busy,
  onSave,
  onDiscard,
}: {
  title: string;
  id: string;
  doc: Doc | undefined;
  dirty: boolean;
  busy: string | null;
  onSave: () => void;
  onDiscard: () => void;
}) {
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
      <div className="flex items-center gap-2">
        <button type="button" onClick={onDiscard} disabled={!dirty || !!busy} className={secondary}>
          تجاهل التعديلات
        </button>
        <button type="button" onClick={onSave} disabled={!dirty || !!busy} className={primary}>
          {busy ?? "حفظ ونشر"}
        </button>
      </div>
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
