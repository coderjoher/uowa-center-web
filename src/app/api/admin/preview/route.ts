import { savePreview } from "@/cms/preview";
import { guard, json, readJson } from "@/cms/http";

export const dynamic = "force-dynamic";

/**
 * PUT { docs: { ar?, en?, settings? } } → stores the editor's unsaved
 * documents for their live preview (only they see them, in draft mode).
 */
export async function PUT(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const body = await readJson<{ docs: Record<string, unknown> }>(request);
  if (!body.docs || typeof body.docs !== "object") return json({ error: "bad request" }, 400);
  await savePreview(user.id, body.docs);
  return json({ ok: true });
}
