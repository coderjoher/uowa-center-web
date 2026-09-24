import { NextResponse } from "next/server";
import { SESSION_COOKIE, configured, issueSession, passwordMatches } from "@/components/admin/session";

/**
 * POST { password } → sets the session cookie. DELETE → clears it.
 * Failed attempts are slowed down a little; the password itself is only
 * ever compared, never logged or echoed.
 */
export async function POST(request: Request) {
  const setup = configured();
  if (!setup.ok) {
    return NextResponse.json({ error: `الإعداد ناقص على الخادم: ${setup.missing.join(", ")}` }, { status: 503 });
  }
  let password = "";
  try {
    password = String(((await request.json()) as { password?: unknown }).password ?? "");
  } catch {}
  if (!password || !(await passwordMatches(password))) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "كلمة المرور غير صحيحة." }, { status: 401 });
  }
  const session = await issueSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, session.value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expires,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0) });
  return res;
}
