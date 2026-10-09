import { endSessionsOf, hashPassword, passwordProblem } from "@/cms/auth";
import { query, transaction } from "@/cms/db";
import { fail, guard, json, readJson } from "@/cms/http";

export const dynamic = "force-dynamic";

/**
 * Account management, admins only. There must always be at least one active
 * admin: the last one can't be demoted, disabled or deleted.
 */

interface Row {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor";
  disabled: boolean;
  created_at: Date;
  last_login_at: Date | null;
}

const ROLES = new Set(["admin", "editor"]);
const EMAIL = /^[^@\s]+@[^@\s]+$/;
const LAST_ADMIN = "يجب أن يبقى مدير واحد فعّال على الأقل.";

export async function GET(request: Request) {
  const user = await guard(request, "admin");
  if (user instanceof Response) return user;
  const rows = await query<Row>(`SELECT id, email, name, role, disabled, created_at, last_login_at FROM cms_users ORDER BY id`);
  return json({
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      disabled: r.disabled,
      createdAt: r.created_at.toISOString(),
      lastLoginAt: r.last_login_at?.toISOString() ?? null,
    })),
  });
}

/** POST { name, email, role, password } → creates an account. */
export async function POST(request: Request) {
  const user = await guard(request, "admin");
  if (user instanceof Response) return user;
  const body = await readJson<{ name: string; email: string; role: string; password: string }>(request);
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "editor");
  const password = String(body.password ?? "");
  if (!name || !EMAIL.test(email) || !ROLES.has(role)) return fail("أدخل الاسم وبريدًا إلكترونيًا صحيحًا ودورًا.", 400);
  const problem = passwordProblem(password);
  if (problem) return fail(problem, 400);
  const exists = await query(`SELECT 1 FROM cms_users WHERE email = $1`, [email]);
  if (exists.length) return fail("يوجد حساب بهذا البريد الإلكتروني.", 409);
  await query(`INSERT INTO cms_users (email, name, role, password_hash) VALUES ($1, $2, $3, $4)`, [
    email,
    name,
    role,
    await hashPassword(password),
  ]);
  return json({ ok: true }, 201);
}

/** PATCH { id, name?, role?, disabled?, password? } → changes an account. */
export async function PATCH(request: Request) {
  const user = await guard(request, "admin");
  if (user instanceof Response) return user;
  const body = await readJson<{ id: number; name: string; role: string; disabled: boolean; password: string }>(request);
  if (typeof body.id !== "number") return fail("bad request", 400);
  if (body.role !== undefined && !ROLES.has(String(body.role))) return fail("bad request", 400);
  if (body.password !== undefined) {
    const problem = passwordProblem(String(body.password));
    if (problem) return fail(problem, 400);
  }
  const hash = body.password !== undefined ? await hashPassword(String(body.password)) : null;

  const result = await transaction(async (db) => {
    await db.query("LOCK TABLE cms_users IN SHARE ROW EXCLUSIVE MODE");
    const found = await db.query<Row>(`SELECT * FROM cms_users WHERE id = $1`, [body.id]);
    const target = found.rows[0];
    if (!target) return "missing";
    const role = (body.role as Row["role"] | undefined) ?? target.role;
    const disabled = typeof body.disabled === "boolean" ? body.disabled : target.disabled;
    const losesAdmin = target.role === "admin" && !target.disabled && (role !== "admin" || disabled);
    if (losesAdmin) {
      const admins = await db.query(`SELECT 1 FROM cms_users WHERE role = 'admin' AND NOT disabled`);
      if ((admins.rowCount ?? 0) <= 1) return "last-admin";
    }
    await db.query(`UPDATE cms_users SET name = $2, role = $3, disabled = $4, password_hash = coalesce($5, password_hash) WHERE id = $1`, [
      body.id,
      typeof body.name === "string" && body.name.trim() ? body.name.trim() : target.name,
      role,
      disabled,
      hash,
    ]);
    return disabled || hash ? "ended" : "ok";
  });
  if (result === "missing") return fail("not found", 404);
  if (result === "last-admin") return fail(LAST_ADMIN, 409);
  /* A disabled account, or one whose password an admin reset, is signed out everywhere. */
  if (result === "ended" && body.id !== user.id) await endSessionsOf(body.id);
  return json({ ok: true });
}

/** DELETE ?id=… → deletes an account (not your own). Its edits stay in the history. */
export async function DELETE(request: Request) {
  const user = await guard(request, "admin");
  if (user instanceof Response) return user;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return fail("bad request", 400);
  if (id === user.id) return fail("لا يمكنك حذف حسابك.", 409);
  const result = await transaction(async (db) => {
    await db.query("LOCK TABLE cms_users IN SHARE ROW EXCLUSIVE MODE");
    const found = await db.query<Row>(`SELECT * FROM cms_users WHERE id = $1`, [id]);
    const target = found.rows[0];
    if (!target) return "ok";
    if (target.role === "admin" && !target.disabled) {
      const admins = await db.query(`SELECT 1 FROM cms_users WHERE role = 'admin' AND NOT disabled`);
      if ((admins.rowCount ?? 0) <= 1) return "last-admin";
    }
    await db.query(`DELETE FROM cms_users WHERE id = $1`, [id]);
    return "ok";
  });
  if (result === "last-admin") return fail(LAST_ADMIN, 409);
  return json({ ok: true });
}
