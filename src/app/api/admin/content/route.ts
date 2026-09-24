import { NextResponse } from "next/server";
import { githubToken, hasSession } from "@/components/admin/session";
import { GitHubError, readFile, writeFile } from "@/components/admin/github";

export const dynamic = "force-dynamic";

/** The three files the admin may read and write, by short name. */
const FILES: Record<string, string> = {
  ar: "public/content/ar.json",
  en: "public/content/en.json",
  settings: "public/content/settings.json",
};

function fail(e: unknown) {
  if (e instanceof GitHubError) {
    const text =
      e.status === 409
        ? "تغيّر الملف على المستودع منذ فتحه. أعد التحميل ثم كرر التعديل."
        : e.status === 401 || e.status === 403
          ? "رمز GitHub على الخادم غير صالح أو لا يملك صلاحية الكتابة."
          : `GitHub: ${e.message}`;
    return NextResponse.json({ error: text }, { status: e.status === 409 ? 409 : 502 });
  }
  return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
}

/** GET ?file=ar|en|settings → { sha, text } straight from the repository. */
export async function GET(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const key = new URL(request.url).searchParams.get("file") ?? "";
  const path = FILES[key];
  if (!path) return NextResponse.json({ error: "unknown file" }, { status: 400 });
  try {
    const file = await readFile(githubToken(), path);
    return NextResponse.json({ sha: file.sha, text: file.text });
  } catch (e) {
    return fail(e);
  }
}

/** PUT { file, text, sha, message } → commits the file; returns the new sha. */
export async function PUT(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { file?: string; text?: string; sha?: string; message?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {}
  const path = FILES[body.file ?? ""];
  if (!path || typeof body.text !== "string") return NextResponse.json({ error: "bad request" }, { status: 400 });
  try {
    JSON.parse(body.text);
  } catch {
    return NextResponse.json({ error: "المحتوى ليس JSON صالحًا." }, { status: 400 });
  }
  try {
    const sha = await writeFile(githubToken(), path, body.text, body.message?.slice(0, 200) || `content: update ${body.file}`, body.sha);
    return NextResponse.json({ sha });
  } catch (e) {
    return fail(e);
  }
}
