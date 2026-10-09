import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  clearFailures,
  currentUser,
  endSession,
  recordFailure,
  signInLocked,
  startSession,
  userCount,
  verifyPassword,
} from "@/cms/auth";
import { databaseConfigured, query } from "@/cms/db";
import { fail, json, originAllowed, readJson, sessionCookie } from "@/cms/http";

export const dynamic = "force-dynamic";

/** GET → what the admin page should show: setup, sign-in, or the signed-in user. */
export async function GET() {
  if (!databaseConfigured()) return json({ configured: false, needsSetup: false, user: null });
  const [count, user] = await Promise.all([userCount(), currentUser()]);
  return json({ configured: true, needsSetup: count === 0, user });
}

/** POST { email, password } → signs in. */
export async function POST(request: Request) {
  if (!databaseConfigured()) return fail("قاعدة البيانات غير مهيأة على الخادم (DATABASE_URL).", 503);
  if (!originAllowed(request)) return fail("طلب من مصدر غير موثوق.", 403);
  const body = await readJson<{ email: string; password: string }>(request);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${address}|${email}`;
  if (signInLocked(key)) return fail("محاولات كثيرة خاطئة. حاول مجددًا بعد 15 دقيقة.", 429);

  const rows = await query<{ id: number; password_hash: string; disabled: boolean }>(
    `SELECT id, password_hash, disabled FROM cms_users WHERE email = $1`,
    [email],
  );
  const account = rows[0];
  const ok = account && !account.disabled && password && (await verifyPassword(password, account.password_hash));
  if (!ok) {
    recordFailure(key);
    await new Promise((r) => setTimeout(r, 700));
    return fail("البريد الإلكتروني أو كلمة المرور غير صحيحة.", 401);
  }
  clearFailures(key);
  const session = await startSession(account.id);
  (await cookies()).set(SESSION_COOKIE, session.token, sessionCookie(session.expires));
  return json({ ok: true });
}

/** DELETE → signs out. */
export async function DELETE(request: Request) {
  if (!originAllowed(request)) return fail("طلب من مصدر غير موثوق.", 403);
  const jar = await cookies();
  if (databaseConfigured()) await endSession(jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  return json({ ok: true });
}
