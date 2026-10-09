import { ConflictError, InvalidContentError, isDocumentKey, readDocument, saveDocument } from "@/cms/content";
import { fail, guard, json, readJson, refreshSite } from "@/cms/http";

export const dynamic = "force-dynamic";

/** GET ?key=ar|en|settings → { data, version, updatedAt, updatedBy }. */
export async function GET(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const key = new URL(request.url).searchParams.get("key");
  if (!isDocumentKey(key)) return fail("unknown document", 400);
  return json(await readDocument(key));
}

/**
 * PUT { key, data, version, note } → saves the document, based on `version`;
 * 409 if it changed since. The site shows the change on the next visit.
 */
export async function PUT(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const body = await readJson<{ key: string; data: unknown; version: number; note: string }>(request);
  if (!isDocumentKey(body.key) || typeof body.version !== "number") return fail("bad request", 400);
  try {
    const saved = await saveDocument(body.key, body.data, body.version, user, String(body.note ?? ""));
    refreshSite();
    return json({ ...saved, updatedBy: user.name });
  } catch (error) {
    if (error instanceof ConflictError) return fail(error.message, 409);
    if (error instanceof InvalidContentError) return fail(error.message, 400);
    throw error;
  }
}
