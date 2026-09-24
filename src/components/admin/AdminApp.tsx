"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, setAt, type Json, type Path } from "./Editor";
import { SECTION_LABELS, labelFor } from "./labels";

type FileKey = "ar" | "en" | "settings";
const TABS: { key: FileKey; label: string }[] = [
  { key: "ar", label: "المحتوى العربي" },
  { key: "en", label: "المحتوى الإنجليزي" },
  { key: "settings", label: "الإعدادات" },
];

interface Doc {
  sha: string;
  saved: Json;
  draft: Json;
}

const serialize = (doc: Json) => JSON.stringify(doc, null, 2) + "\n";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401) throw new Unauthorized(body.error ?? "unauthorized");
  if (!res.ok) throw new Error(body.error ?? res.statusText);
  return body;
}
class Unauthorized extends Error {}

/**
 * The content admin at `/admin`. Editors sign in with the admin password;
 * the server holds the GitHub token and does the reading and committing
 * (see `src/app/api/admin`). The three content files are loaded from
 * `master`, every key is rendered as a form by `Field`, and a save commits
 * the whole file back. The site's own deploy then publishes the change.
 */
export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<Partial<Record<FileKey, Doc>>>({});
  const [images, setImages] = useState<string[]>([]);
  const [tab, setTab] = useState<FileKey>("ar");
  const [section, setSection] = useState<string>("hero");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy("جارٍ التحميل…");
    setError(null);
    try {
      const [ar, en, settings, imgs] = await Promise.all([
        api<{ sha: string; text: string }>("/api/admin/content?file=ar"),
        api<{ sha: string; text: string }>("/api/admin/content?file=en"),
        api<{ sha: string; text: string }>("/api/admin/content?file=settings"),
        api<{ images: string[] }>("/api/admin/images"),
      ]);
      const toDoc = (f: { sha: string; text: string }): Doc => {
        const parsed = JSON.parse(f.text) as Json;
        return { sha: f.sha, saved: parsed, draft: parsed };
      };
      setDocs({ ar: toDoc(ar), en: toDoc(en), settings: toDoc(settings) });
      setImages(imgs.images);
      setAuthed(true);
    } catch (e) {
      if (e instanceof Unauthorized) setAuthed(false);
      else {
        setAuthed(true);
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(null);
    }
  }, []);

  /* A valid cookie from an earlier visit signs the editor straight in. The
     call is deferred a tick so the effect itself sets no state. */
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const doc = docs[tab];
  const sections = useMemo(
    () => (doc && typeof doc.draft === "object" && doc.draft && !Array.isArray(doc.draft) ? Object.keys(doc.draft) : []),
    [doc],
  );
  const current = sections.includes(section) ? section : sections[0];
  const dirty = doc ? serialize(doc.draft) !== serialize(doc.saved) : false;
  const sectionDirty = (key: string) =>
    doc
      ? JSON.stringify((doc.draft as { [k: string]: Json })[key]) !== JSON.stringify((doc.saved as { [k: string]: Json })[key])
      : false;

  const onChange = (path: Path, value: Json) => {
    setDocs((d) => {
      const cur = d[tab];
      if (!cur) return d;
      return { ...d, [tab]: { ...cur, draft: setAt(cur.draft, path, value) } };
    });
  };

  const save = async () => {
    if (!doc) return;
    setBusy("جارٍ الحفظ…");
    setError(null);
    setNotice(null);
    try {
      const changed = sections.filter(sectionDirty).map((k) => SECTION_LABELS[k] ?? k);
      const { sha } = await api<{ sha: string }>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify({
          file: tab,
          text: serialize(doc.draft),
          sha: doc.sha,
          message: `content(${tab}): ${changed.join("، ") || "update"}`,
        }),
      });
      setDocs((d) => ({ ...d, [tab]: { sha, saved: doc.draft, draft: doc.draft } }));
      setNotice("تم الحفظ. يُنشر التغيير على الموقع خلال دقائق.");
    } catch (e) {
      if (e instanceof Unauthorized) setAuthed(false);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const discard = () => {
    if (!doc) return;
    setDocs((d) => ({ ...d, [tab]: { ...doc, draft: doc.saved } }));
  };

  const upload = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/images", { method: "POST", body: form });
    const body = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
    if (res.status === 401) {
      setAuthed(false);
      throw new Error("انتهت الجلسة، سجّل الدخول مجددًا.");
    }
    if (!res.ok || !body.path) throw new Error(body.error ?? res.statusText);
    setImages((list) => [...list, body.path as string]);
    return body.path;
  };

  const signOut = async () => {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    setAuthed(false);
    setDocs({});
  };

  if (authed === null) {
    return <div className="flex min-h-dvh items-center justify-center bg-navy text-[15px] text-pale">جارٍ التحميل…</div>;
  }
  if (!authed) {
    return <SignIn onSignedIn={() => void load()} />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-soft bg-white px-4">
        <div className="flex items-center gap-3">
          <span className="h-0.5 w-6 bg-gold" />
          <span className="text-[15px] font-bold text-navy">لوحة تحكم المحتوى</span>
          <a href="/ar" target="_blank" rel="noreferrer" className="text-[13px] text-muted underline hover:text-navy">
            فتح الموقع
          </a>
        </div>
        <button type="button" onClick={() => void signOut()} className="cursor-pointer text-[13px] text-muted underline hover:text-navy">
          تسجيل الخروج
        </button>
      </header>

      {/* File tabs */}
      <div className="flex shrink-0 gap-1 border-b border-border-soft bg-white px-4">
        {TABS.map((t) => {
          const d = docs[t.key];
          const isDirty = d ? serialize(d.draft) !== serialize(d.saved) : false;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`-mb-px cursor-pointer border-b-2 px-3 py-2.5 text-[14px] ${
                tab === t.key ? "border-gold font-bold text-navy" : "border-transparent text-muted hover:text-navy"
              }`}
            >
              {t.label}
              {isDirty ? " •" : ""}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sections */}
        <nav className="w-56 shrink-0 overflow-y-auto border-e border-border-soft bg-white py-2">
          {sections.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSection(k)}
              className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-start text-[14px] ${
                current === k ? "bg-surface font-bold text-navy" : "text-body hover:bg-surface/60"
              }`}
            >
              <span>{SECTION_LABELS[k] ?? k}</span>
              {sectionDirty(k) ? <span className="h-2 w-2 rounded-full bg-gold" /> : null}
            </button>
          ))}
        </nav>

        {/* Form */}
        <main className="min-w-0 flex-1 overflow-y-auto p-5">
          <div className="mx-auto flex max-w-[860px] flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[22px] font-bold text-navy">
                {current ? labelFor(current) : ""}{" "}
                <span dir="ltr" className="text-[13px] font-normal text-muted">
                  {current}
                </span>
              </h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={discard}
                  disabled={!dirty || !!busy}
                  className="h-10 cursor-pointer border border-border-soft bg-white px-4 text-[14px] text-navy hover:border-navy disabled:cursor-default disabled:opacity-40"
                >
                  تجاهل التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={!dirty || !!busy}
                  className="h-10 cursor-pointer bg-navy px-5 text-[14px] font-bold text-white hover:opacity-90 disabled:cursor-default disabled:opacity-40"
                >
                  {busy ?? "حفظ ونشر"}
                </button>
              </div>
            </div>
            {error ? <p className="border border-danger/40 bg-white p-3 text-[14px] text-danger">{error}</p> : null}
            {notice ? <p className="border border-border-soft bg-white p-3 text-[14px] text-navy">{notice}</p> : null}
            {doc && current ? (
              <Field
                key={`${tab}:${current}`}
                name={current}
                value={(doc.draft as { [k: string]: Json })[current]}
                path={[current]}
                onChange={onChange}
                ctx={{ upload, images }}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "تعذّر تسجيل الدخول.");
      setPassword("");
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy px-5">
      <form onSubmit={submit} className="flex w-full max-w-[420px] flex-col gap-4 border-s-4 border-gold bg-white p-6">
        <div>
          <p className="text-[12px] tracking-[2px] text-muted">UOWA · الحاسبة الإلكترونية</p>
          <h1 className="mt-1 text-[22px] font-bold text-navy">لوحة تحكم المحتوى</h1>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-muted">كلمة المرور</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full border border-border-soft px-3 text-[15px] text-navy outline-none focus:border-navy"
          />
        </label>
        {error ? <p className="text-[13px] text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !password}
          className="h-11 cursor-pointer bg-navy text-[15px] font-bold text-white hover:opacity-90 disabled:cursor-default disabled:opacity-40"
        >
          {busy ? "جارٍ الدخول…" : "دخول"}
        </button>
      </form>
    </div>
  );
}
