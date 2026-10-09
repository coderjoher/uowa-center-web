import { endSessionsOf, hashPassword, passwordProblem, sessionToken, verifyPassword } from "@/cms/auth";
import { query } from "@/cms/db";
import { fail, guard, json, readJson } from "@/cms/http";

export const dynamic = "force-dynamic";

/**
 * PATCH { name?, currentPassword?, newPassword? } → updates your own account.
 * A new password needs the current one, and signs you out everywhere else.
 */
export async function PATCH(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const body = await readJson<{ name: string; currentPassword: string; newPassword: string }>(request);

  if (typeof body.newPassword === "string") {
    const problem = passwordProblem(body.newPassword);
    if (problem) return fail(problem, 400);
    const rows = await query<{ password_hash: string }>(`SELECT password_hash FROM cms_users WHERE id = $1`, [user.id]);
    if (!(await verifyPassword(String(body.currentPassword ?? ""), rows[0].password_hash))) {
      return fail("كلمة المرور الحالية غير صحيحة.", 400);
    }
    await query(`UPDATE cms_users SET password_hash = $2 WHERE id = $1`, [user.id, await hashPassword(body.newPassword)]);
    await endSessionsOf(user.id, await sessionToken());
  }
  if (typeof body.name === "string" && body.name.trim()) {
    await query(`UPDATE cms_users SET name = $2 WHERE id = $1`, [user.id, body.name.trim()]);
  }
  return json({ ok: true });
}
