import { draftMode } from "next/headers";
import { vercelStegaCombine } from "@vercel/stega";
import { currentUser } from "./auth";
import { DOCUMENT_KEYS, query, type DocumentKey } from "./db";
import { isDocumentKey, readAllDocuments } from "./content";
import { sanitizeDocument } from "./sanitize";

/**
 * The live preview in the admin.
 *
 * While an editor works, the admin sends their unsaved content here
 * (cms_previews, one row per editor and document). The preview iframe runs
 * the real site in Next's draft mode: for that editor, pages render from
 * those unsaved documents instead of the published ones, and every piece of
 * text carries an invisible marker naming where it lives in the content, so
 * a click in the preview can open the right field (see PreviewBridge).
 * Visitors never have draft mode, so none of this reaches them.
 */

type Data = Record<string, unknown>;
const MAX_BYTES = 2 * 1024 * 1024;

export async function savePreview(userId: number, docs: Record<string, unknown>): Promise<void> {
  for (const [key, data] of Object.entries(docs)) {
    if (!isDocumentKey(key) || !data || typeof data !== "object" || Array.isArray(data)) continue;
    const text = JSON.stringify(sanitizeDocument(data as Data));
    if (text.length > MAX_BYTES) continue;
    await query(
      `INSERT INTO cms_previews (user_id, key, data, updated_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id, key) DO UPDATE SET data = $3, updated_at = now()`,
      [userId, key, text],
    );
  }
}

/** The editor previewing this request, when the request is in draft mode. */
export async function previewer(): Promise<{ id: number } | null> {
  try {
    if (!(await draftMode()).isEnabled) return null;
  } catch {
    /* Outside a request (e.g. while building): never a preview. */
    return null;
  }
  return currentUser();
}

/** The published documents with this editor's unsaved ones laid over them. */
export async function readPreviewDocuments(userId: number): Promise<Record<DocumentKey, Data>> {
  const docs = await readAllDocuments();
  const rows = await query<{ key: string; data: Data }>(`SELECT key, data FROM cms_previews WHERE user_id = $1`, [userId]);
  for (const row of rows) if (isDocumentKey(row.key)) docs[row.key] = { ...docs[row.key], ...row.data };
  return docs;
}

export const ALL_DOCUMENTS = DOCUMENT_KEYS;

/* Values that are addresses, file paths or switches rather than text: they
   must stay exactly as they are. */
const RAW_KEY = /(^|[a-z])(href|Href|slug|src|Webm|youtube|images?|Image|poster|portrait|logo|file|video|icon|type|section|offsetY)$/;

/** Marks every text value with its location: the document key and the path within it. */
export function markForPreview<T>(value: T, key: string, path: (string | number)[] = []): T {
  if (typeof value === "string") {
    const last = [...path].reverse().find((p) => typeof p === "string") as string | undefined;
    if (!value || (last && RAW_KEY.test(last))) return value;
    return vercelStegaCombine(value, { k: key, p: path }, "auto") as T;
  }
  if (Array.isArray(value)) return value.map((v, i) => markForPreview(v, key, [...path, i])) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "type" || k === "section" ? v : markForPreview(v, key, [...path, k])])) as T;
  }
  return value;
}
