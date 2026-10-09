import { cookies } from "next/headers";
import { SESSION_COOKIE, hashPassword, passwordProblem, startSession } from "@/cms/auth";
import { databaseConfigured, transaction } from "@/cms/db";
import { fail, json, originAllowed, readJson, sessionCookie } from "@/cms/http";

export const dynamic = "force-dynamic";

/**
 * POST { name, email, password } → creates the first account, an admin, and
 * signs it in. Only works while there are no accounts at all, so do it right
 * after installing.
 */
export async function POST(request: Request) {
  if (!databaseConfigured()) return fail("قاعدة البيانات غير مهيأة على الخادم (DATABASE_URL).", 503);
  if (!originAllowed(request)) return fail("طلب من مصدر غير موثوق.", 403);
  const body = await readJson<{ name: string; email: string; password: string }>(request);
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!name || !/^[^@\s]+@[^@\s]+$/.test(email)) return fail("أدخل الاسم وبريدًا إلكترونيًا صحيحًا.", 400);
  const problem = passwordProblem(password);
  if (problem) return fail(problem, 400);

  const hash = await hashPassword(password);
  const id = await transaction(async (db) => {
    /* Serialise concurrent attempts; only the first one wins. */
    await db.query("LOCK TABLE cms_users IN EXCLUSIVE MODE");
    const existing = await db.query(`SELECT 1 FROM cms_users LIMIT 1`);
    if (existing.rowCount) return null;
    const created = await db.query<{ id: number }>(
      `INSERT INTO cms_users (email, name, role, password_hash) VALUES ($1, $2, 'admin', $3) RETURNING id`,
      [email, name, hash],
    );
    return created.rows[0].id;
  });
  if (id === null) return fail("تم إنشاء حساب المدير مسبقًا. سجّل الدخول.", 409);
  const session = await startSession(id);
  (await cookies()).set(SESSION_COOKIE, session.token, sessionCookie(session.expires));
  return json({ ok: true });
}
