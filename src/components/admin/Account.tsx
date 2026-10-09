"use client";

import { useState } from "react";
import { api, errorText, type Me } from "./api";
import { ROLE_LABELS } from "./Users";
import { card, h1, input, primary, small } from "./ui";

/** Your own account: name and password. */
export function Account({ me, onRenamed, onError }: { me: Me; onRenamed: (name: string) => void; onError: (e: unknown) => void }) {
  const [name, setName] = useState(me.name);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent, body: object, done: string, after?: () => void) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api("/api/admin/account", { method: "PATCH", body: JSON.stringify(body) });
      after?.();
      setMessage({ ok: true, text: done });
    } catch (err) {
      onError(err);
      setMessage({ ok: false, text: errorText(err) });
    }
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <h1 className={h1}>حسابي</h1>
      <p className={small} dir="auto">
        {me.email} · {ROLE_LABELS[me.role]}
      </p>
      {message ? <p className={`border bg-white p-3 text-[14px] ${message.ok ? "border-border-soft text-navy" : "border-danger/40 text-danger"}`}>{message.text}</p> : null}
      <form onSubmit={(e) => void submit(e, { name }, "تم حفظ الاسم.", () => onRenamed(name))} className={`${card} flex flex-col gap-3`}>
        <label className="flex flex-col gap-1">
          <span className={small}>الاسم</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <button type="submit" className={`${primary} self-start`} disabled={!name.trim() || name === me.name}>
          حفظ الاسم
        </button>
      </form>
      <form
        onSubmit={(e) =>
          void submit(e, { currentPassword: current, newPassword: next }, "تم تغيير كلمة المرور، وأُنهيت جلساتك على الأجهزة الأخرى.", () => {
            setCurrent("");
            setNext("");
          })
        }
        className={`${card} flex flex-col gap-3`}
      >
        <label className="flex flex-col gap-1">
          <span className={small}>كلمة المرور الحالية</span>
          <input dir="ltr" type="password" autoComplete="current-password" className={input} value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className={small}>كلمة المرور الجديدة (10 أحرف على الأقل)</span>
          <input dir="ltr" type="password" autoComplete="new-password" className={input} value={next} onChange={(e) => setNext(e.target.value)} required minLength={10} />
        </label>
        <button type="submit" className={`${primary} self-start`} disabled={!current || next.length < 10}>
          تغيير كلمة المرور
        </button>
      </form>
    </div>
  );
}
