"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, formatDate, type Me, type Role } from "./api";
import { btn, card, h1, input, primary, small } from "./ui";

interface Account {
  id: number;
  email: string;
  name: string;
  role: Role;
  disabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export const ROLE_LABELS: Record<Role, string> = { admin: "مدير", editor: "محرر" };

/** Accounts: create, change role, disable, reset password, delete. Admins only. */
export function Users({ me, onError }: { me: Me; onError: (e: unknown) => void }) {
  const [users, setUsers] = useState<Account[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "editor" as Role, password: "" });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers((await api<{ users: Account[] }>("/api/admin/users")).users);
    } catch (e) {
      onError(e);
    }
  }, [onError]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const run = async (work: () => Promise<unknown>, done: string) => {
    setMessage(null);
    try {
      await work();
      setMessage({ ok: true, text: done });
      await load();
    } catch (e) {
      onError(e);
      setMessage({ ok: false, text: errorText(e) });
    }
  };

  const patch = (id: number, body: object, done: string) =>
    run(() => api("/api/admin/users", { method: "PATCH", body: JSON.stringify({ id, ...body }) }), done);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await api("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", role: "editor", password: "" });
    }, "تم إنشاء الحساب. أرسل كلمة المرور لصاحبه ليغيّرها من «حسابي».");
  };

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-4">
      <h1 className={h1}>المستخدمون</h1>
      <p className={small}>المدير يدير الحسابات والمحتوى، والمحرر يعدّل المحتوى والوسائط فقط.</p>
      {message ? <p className={`border bg-white p-3 text-[14px] ${message.ok ? "border-border-soft text-navy" : "border-danger/40 text-danger"}`}>{message.text}</p> : null}

      <div className="flex flex-col gap-2">
        {users === null ? <p className={small}>جارٍ التحميل…</p> : null}
        {users?.map((u) => (
          <div key={u.id} className={`${card} flex flex-wrap items-center justify-between gap-3 ${u.disabled ? "opacity-60" : ""}`}>
            <div className="flex min-w-0 flex-col">
              <span className="text-[15px] font-bold text-navy">
                {u.name} {u.id === me.id ? <span className="text-[12px] font-normal text-muted">(أنت)</span> : null}
                {u.disabled ? <span className="ms-2 text-[12px] font-normal text-danger">معطّل</span> : null}
              </span>
              <span className={small} dir="ltr">
                {u.email}
              </span>
              <span className={small}>آخر دخول: {formatDate(u.lastLoginAt)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={btn}
                value={u.role}
                onChange={(e) => void patch(u.id, { role: e.target.value }, "تم تغيير الدور.")}
              >
                <option value="editor">{ROLE_LABELS.editor}</option>
                <option value="admin">{ROLE_LABELS.admin}</option>
              </select>
              {u.id === me.id ? null : (
                <>
                  <button
                    type="button"
                    className={btn}
                    onClick={() => {
                      const password = window.prompt(`كلمة مرور جديدة لـ ${u.name} (10 أحرف على الأقل):`);
                      if (password) void patch(u.id, { password }, "تم تغيير كلمة المرور وإنهاء جلسات الحساب.");
                    }}
                  >
                    كلمة مرور جديدة
                  </button>
                  <button
                    type="button"
                    className={btn}
                    onClick={() => void patch(u.id, { disabled: !u.disabled }, u.disabled ? "تم تفعيل الحساب." : "تم تعطيل الحساب.")}
                  >
                    {u.disabled ? "تفعيل" : "تعطيل"}
                  </button>
                  <button
                    type="button"
                    className={`${btn} text-danger`}
                    onClick={() => {
                      if (window.confirm(`حذف حساب ${u.name}؟ تبقى تعديلاته في السجل.`)) {
                        void run(() => api(`/api/admin/users?id=${u.id}`, { method: "DELETE" }), "تم حذف الحساب.");
                      }
                    }}
                  >
                    حذف
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={create} className={`${card} flex flex-col gap-3`}>
        <h2 className="text-[16px] font-bold text-navy">حساب جديد</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={small}>الاسم</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className={small}>البريد الإلكتروني</span>
            <input dir="ltr" type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className={small}>الدور</span>
            <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="editor">{ROLE_LABELS.editor}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={small}>كلمة مرور مؤقتة (10 أحرف على الأقل)</span>
            <input dir="ltr" type="text" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={10} />
          </label>
        </div>
        <button type="submit" className={`${primary} self-start`}>
          إنشاء الحساب
        </button>
      </form>
    </div>
  );
}
