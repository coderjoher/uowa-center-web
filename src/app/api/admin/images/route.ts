import { NextResponse } from "next/server";
import { githubToken, hasSession } from "@/components/admin/session";
import { GitHubError, listDir, writeBinary } from "@/components/admin/github";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/** GET → public paths of every picture in the repository. */
export async function GET() {
  if (!(await hasSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const token = githubToken();
    const [images, uploads] = await Promise.all([listDir(token, "public/images"), listDir(token, "public/images/uploads")]);
    return NextResponse.json({
      images: [...images.map((n) => `/images/${n}`), ...uploads.map((n) => `/images/uploads/${n}`)],
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

/** POST multipart { file } → commits it under public/images/uploads; returns its path. */
export async function POST(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "نوع الملف غير مدعوم (JPG, PNG, WebP, GIF, SVG)." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "حجم الصورة يتجاوز 8 ميغابايت." }, { status: 400 });

  const stem = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const name = `${Date.now()}-${stem}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  try {
    await writeBinary(githubToken(), `public/images/uploads/${name}`, btoa(bin), `content: upload ${name}`);
    return NextResponse.json({ path: `/images/uploads/${name}` });
  } catch (e) {
    const status = e instanceof GitHubError ? 502 : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status });
  }
}
