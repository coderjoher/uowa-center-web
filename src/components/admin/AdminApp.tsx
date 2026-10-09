"use client";

import { useCallback, useEffect, useState } from "react";
import { Account } from "./Account";
import { COLLECTIONS, GLOBAL_GROUPS } from "./collections";
import { pathKey } from "./Editor";
import { History } from "./History";
import { MediaLibrary } from "./MediaLibrary";
import { routeForPath } from "./routing";
import { SaveControls } from "./SaveBar";
import { Search, type SearchHit } from "./Search";
import { CmsProvider, useCms, type Doc, type Route } from "./store";
import { Users } from "./Users";
import { CollectionList, Dashboard, GlobalEdit, GLOBAL_LABEL, ItemEdit, SettingsEdit } from "./Views";
import { VisualBuilder } from "./VisualBuilder";
import { Conflict, Unauthorized, api, errorText, type DocKey, type Json, type Me } from "./api";
import { primary, secondary } from "./ui";

type Phase = "loading" | "unconfigured" | "setup" | "signin" | "ready";

interface Loaded {
  data: Json;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
}

/**
 * The content admin at /admin, organised like Strapi and Payload: a
 * dashboard; the page builder (pages as layers on the live site); the
 * collections (news, courses, services… as tables with an edit screen per
 * item); the globals (single documents: the menu, the footer, each
 * section's texts); and the media library, history and accounts.
 */
export default function AdminApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [docs, setDocs] = useState<Record<DocKey, Doc> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const s = await api<{ configured: boolean; needsSetup: boolean; user: Me | null }>("/api/admin/session");
      if (!s.configured) return setPhase("unconfigured");
      if (s.needsSetup) return setPhase("setup");
      if (!s.user) return setPhase("signin");
      const load = async (key: DocKey): Promise<Doc> => {
        const d = await api<Loaded>(`/api/admin/content?key=${key}`);
        return { saved: d.data, draft: d.data, version: d.version, updatedAt: d.updatedAt, updatedBy: d.updatedBy };
      };
      const [ar, en, settings] = await Promise.all([load("ar"), load("en"), load("settings")]);
      setMe(s.user);
      setDocs({ ar, en, settings });
      setPhase("ready");
    } catch (e) {
      if (e instanceof Unauthorized) setPhase("signin");
      else {
        setError(errorText(e));
        setPhase((p) => (p === "loading" ? "signin" : p));
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void start(), 0);
    return () => clearTimeout(t);
  }, [start]);

  const signedOut = useCallback(() => {
    setDocs(null);
    setMe(null);
    setPhase("signin");
  }, []);

  if (phase === "loading") return <Splash text="جارٍ التحميل…" />;
  if (phase === "unconfigured") {
    return <Splash text="لوحة التحكم غير مهيأة على هذا الخادم: لا توجد قاعدة بيانات (DATABASE_URL). يعرض الموقع المحتوى المضمّن فيه." />;
  }
  if (phase === "setup") return <Setup onDone={() => void start()} />;
  if (phase === "signin" || !me || !docs) return <SignIn onSignedIn={() => void start()} error={error} />;

  return (
    <CmsProvider me={me} initialDocs={docs} onSignedOut={signedOut}>
      <Shell onSignedOut={signedOut} />
    </CmsProvider>
  );
}

/** After the search or a click in the preview, scroll to the field and focus it. */
function useFocusField() {
  const { focus } = useCms();
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-path='${pathKey(focus.path).replace(/'/g, "\\'")}']`);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("ring-2", "ring-gold");
      setTimeout(() => el.classList.remove("ring-2", "ring-gold"), 2200);
      (el.querySelector("input, textarea, [contenteditable]") as HTMLElement | null)?.focus({ preventScroll: true });
    }, 120);
    return () => clearTimeout(t);
  }, [focus]);
}

function Shell({ onSignedOut }: { onSignedOut: () => void }) {
  const cms = useCms();
  const { me, route, go, docs, setLocale, setFocus, error, notice, conflict, reloadLatest, dirtyKeys } = cms;
  const [menuOpen, setMenuOpen] = useState(false);
  useFocusField();

  const signOut = async () => {
    if (dirtyKeys.length && !window.confirm("لديك تعديلات غير محفوظة ستُفقد. تسجيل الخروج؟")) return;
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
    onSignedOut();
  };

  const jump = (hit: SearchHit) => {
    setLocale(hit.locale);
    go(routeForPath(hit.path, docs[hit.locale]?.draft));
    setFocus(hit.path);
  };

  if (route.name === "builder") return <VisualBuilder key={route.page ?? "home"} page={route.page} />;

  const nav = (label: string, target: Route, extra?: string) => {
    const active = JSON.stringify(route) === JSON.stringify(target) || (target.name === "collection" && route.name === "item" && route.id === target.id);
    return (
      <button
        key={label}
        type="button"
        onClick={() => {
          go(target);
          setMenuOpen(false);
        }}
        className={`flex w-full cursor-pointer items-center justify-between rounded-sm px-3 py-1.5 text-start text-[14px] ${active ? "bg-navy text-white" : "text-body hover:bg-surface"}`}
      >
        <span className="truncate">{label}</span>
        {extra ? <span className={`text-[11px] ${active ? "text-white/70" : "text-muted"}`}>{extra}</span> : null}
      </button>
    );
  };
  const group = (title: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-1 pt-4 text-[11px] font-bold tracking-wide text-muted">{title}</p>
      {children}
    </div>
  );
  const ar = docs.ar?.draft;

  const sidebar = (
    <nav className="flex flex-col p-2 pb-8">
      {nav("لوحة التحكم", { name: "dashboard" })}
      {group(
        "الصفحات",
        <>
          {nav("منشئ الصفحات", { name: "builder", page: "home" })}
        </>,
      )}
      {group(
        "المجموعات",
        COLLECTIONS.map((c) => {
          let list: Json | undefined = ar;
          for (const p of c.path) list = list && typeof list === "object" ? (list as { [k: string]: Json })[p] : undefined;
          return nav(c.label, { name: "collection", id: c.id }, String(Array.isArray(list) ? list.length : 0));
        }),
      )}
      {GLOBAL_GROUPS.map((g) => group(g.label, g.keys.map((k) => nav(GLOBAL_LABEL(k), { name: "global", key: k }))))}
      {group(
        "الإدارة",
        <>
          {nav("إظهار الأقسام", { name: "global", key: "settings" })}
          {nav("مكتبة الوسائط", { name: "media" })}
          {nav("سجل التعديلات", { name: "history" })}
          {me.role === "admin" ? nav("المستخدمون", { name: "users" }) : null}
          {nav("حسابي", { name: "account" })}
        </>,
      )}
    </nav>
  );

  let view: React.ReactNode = null;
  if (route.name === "dashboard") view = <Dashboard />;
  else if (route.name === "collection") view = <CollectionList key={route.id} id={route.id} />;
  else if (route.name === "item") view = <ItemEdit key={`${route.id}:${route.index}`} id={route.id} index={route.index} />;
  else if (route.name === "global") view = route.key === "settings" ? <SettingsEdit /> : <GlobalEdit key={route.key} globalKey={route.key} />;
  else if (route.name === "media") view = <Padded><MediaLibrary onUnauthorized={(e) => (e instanceof Unauthorized ? (onSignedOut(), true) : false)} /></Padded>;
  else if (route.name === "history")
    view = (
      <Padded>
        <History current={{ ar: docs.ar, en: docs.en, settings: docs.settings }} dirty={cms.isDirty} onRestore={cms.restore} onRevertSection={cms.revertSection} onError={cms.onError} />
      </Padded>
    );
  else if (route.name === "users" && me.role === "admin") view = <Padded><Users me={me} onError={cms.onError} /></Padded>;
  else if (route.name === "account") view = <Padded><Account me={me} onRenamed={(name) => cms.setMe({ ...me, name })} onError={cms.onError} /></Padded>;

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-soft bg-white px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" className="cursor-pointer px-2 text-[20px] text-navy md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="القائمة">
            ☰
          </button>
          <span className="h-0.5 w-6 shrink-0 bg-gold" />
          <span className="hidden truncate text-[15px] font-bold text-navy lg:inline">لوحة تحكم المحتوى</span>
          <a href="/ar" target="_blank" rel="noreferrer" className="hidden shrink-0 text-[13px] text-muted underline hover:text-navy sm:inline">
            الموقع ↗
          </a>
        </div>
        <Search docs={{ ar: docs.ar?.draft, en: docs.en?.draft }} onPick={jump} />
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden md:block">
            <SaveControls />
          </div>
          <button type="button" onClick={() => void signOut()} className="cursor-pointer text-[13px] text-muted underline hover:text-navy" title={me.email}>
            خروج
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className={`${menuOpen ? "fixed inset-y-14 start-0 z-40 w-64 shadow-xl" : "hidden"} shrink-0 overflow-y-auto border-e border-border-soft bg-white md:static md:block md:w-60`}>
          {sidebar}
        </aside>
        <main className="relative min-w-0 flex-1">
          {view}
          {error || notice ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4">
              <div
                className={`pointer-events-auto flex max-w-[720px] flex-wrap items-center gap-3 border px-4 py-3 text-[14px] shadow-lg ${
                  error ? "border-danger/40 bg-white text-danger" : "border-border-soft bg-navy text-white"
                }`}
                role="status"
              >
                <span>{error ?? notice}</span>
                {error && conflict ? (
                  <button type="button" className={`${secondary} h-8`} onClick={() => void reloadLatest(conflict)}>
                    تحميل أحدث نسخة
                  </button>
                ) : null}
                <button type="button" className="cursor-pointer text-[13px] underline opacity-80" onClick={cms.dismiss}>
                  إغلاق
                </button>
              </div>
            </div>
          ) : null}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-soft bg-white p-2 md:hidden">
            <SaveControls compact />
          </div>
        </main>
      </div>
    </div>
  );
}

function Padded({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-y-auto p-5 md:p-8">{children}</div>;
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

function SignIn({ onSignedIn, error: initialError }: { onSignedIn: () => void; error?: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

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
