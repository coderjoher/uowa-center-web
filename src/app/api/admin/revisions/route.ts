import { ConflictError, isDocumentKey, listRevisions, readRevision, saveDocument } from "@/cms/content";
import { fail, guard, json, readJson, refreshSite } from "@/cms/http";

export const dynamic = "force-dynamic";

/** GET ?key=… → the document's history. GET ?id=… → one revision's content. */
export async function GET(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const params = new URL(request.url).searchParams;
  const id = Number(params.get("id"));
  if (id) {
    const revision = await readRevision(id);
    return revision ? json(revision) : fail("not found", 404);
  }
  const key = params.get("key");
  if (!isDocumentKey(key)) return fail("unknown document", 400);
  return json({ revisions: await listRevisions(key) });
}

/** POST { id, version } → restores revision `id` as a new save on top of `version`. */
export async function POST(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const body = await readJson<{ id: number; version: number }>(request);
  const revision = typeof body.id === "number" ? await readRevision(body.id) : null;
  if (!revision || typeof body.version !== "number") return fail("bad request", 400);
  try {
    const saved = await saveDocument(revision.key, revision.data, body.version, user, `استعادة النسخة ${revision.version}`);
    refreshSite();
    return json({ ...saved, data: revision.data, updatedBy: user.name });
  } catch (error) {
    if (error instanceof ConflictError) return fail(error.message, 409);
    throw error;
  }
}
