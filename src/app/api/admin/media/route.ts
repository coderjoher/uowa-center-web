import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { MediaError, deleteMedia, listMedia, saveUpload, updateAlt, usageOf } from "@/cms/media";
import { fail, guard, json, readJson, refreshSite } from "@/cms/http";

export const dynamic = "force-dynamic";

/** GET → every uploaded and bundled file. GET ?usage=<url> → documents using it. */
export async function GET(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const usage = new URL(request.url).searchParams.get("usage");
  if (usage) return json({ usedIn: await usageOf(usage) });
  return json({ items: await listMedia() });
}

/**
 * POST with the file itself as the body (not multipart), its type in
 * Content-Type and its name in X-File-Name (URI-encoded). Streamed to disk.
 */
export async function POST(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const mime = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  let name = "file";
  try {
    name = decodeURIComponent(request.headers.get("x-file-name") ?? "file");
  } catch {}
  try {
    const item = await saveUpload(request.body as WebReadableStream<Uint8Array> | null, mime, name, user);
    return json({ item }, 201);
  } catch (error) {
    if (error instanceof MediaError) return fail(error.message, 400);
    throw error;
  }
}

/** PATCH { id, alt } → updates a file's description. */
export async function PATCH(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const body = await readJson<{ id: number; alt: string }>(request);
  if (typeof body.id !== "number") return fail("bad request", 400);
  await updateAlt(body.id, String(body.alt ?? ""));
  return json({ ok: true });
}

/** DELETE ?id=… → removes an uploaded file that the content no longer uses. */
export async function DELETE(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return fail("bad request", 400);
  try {
    await deleteMedia(id);
    refreshSite();
    return json({ ok: true });
  } catch (error) {
    if (error instanceof MediaError) return fail(error.message, 409);
    throw error;
  }
}
