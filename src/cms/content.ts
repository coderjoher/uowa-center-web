import { BUNDLED_DOCUMENTS, DOCUMENT_KEYS, query, transaction, type DocumentKey } from "./db";
import type { User } from "./auth";
import { sanitizeDocument } from "./sanitize";

/**
 * Reading and saving the content documents, with history.
 *
 * Every save names the version it was based on. If someone else saved in
 * the meantime the save is refused (a conflict) instead of silently
 * overwriting their work. Each save stores a revision; the newest 100 per
 * document are kept, and any of them can be restored (which is itself a new
 * save, so a restore can be undone).
 */

type Data = Record<string, unknown>;
const KEEP_REVISIONS = 100;
const MAX_BYTES = 2 * 1024 * 1024;

export function isDocumentKey(key: unknown): key is DocumentKey {
  return typeof key === "string" && (DOCUMENT_KEYS as readonly string[]).includes(key);
}

/**
 * Sections added to the bundled JSON after the database was seeded (new
 * features in the code) are filled in from the bundle, so they are editable
 * and render even before anyone saves them.
 */
function withNewSections(key: DocumentKey, data: Data): Data {
  const merged = { ...BUNDLED_DOCUMENTS[key], ...data };
  /* New fields in a section the database already holds (a section's own
     keys only; lists and the builder's layouts are left as stored). */
  for (const [name, bundled] of Object.entries(BUNDLED_DOCUMENTS[key])) {
    const stored = data[name];
    if (name === "homeBlocks" || !isPlainObject(bundled) || !isPlainObject(stored)) continue;
    merged[name] = { ...bundled, ...stored };
  }
  /* New section switches, too (the switches are one level down). */
  if (key === "settings") {
    merged.sections = { ...(BUNDLED_DOCUMENTS.settings.sections as Data), ...((data.sections as Data | undefined) ?? {}) };
  }
  return merged;
}

const isPlainObject = (value: unknown): value is Data => typeof value === "object" && value !== null && !Array.isArray(value);

export interface StoredDocument {
  key: DocumentKey;
  data: Data;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
}

export async function readDocument(key: DocumentKey): Promise<StoredDocument> {
  const rows = await query<{ data: Data; version: number; updated_at: Date; name: string | null }>(
    `SELECT d.data, d.version, d.updated_at, u.name FROM cms_documents d
     LEFT JOIN cms_users u ON u.id = d.updated_by WHERE d.key = $1`,
    [key],
  );
  const row = rows[0];
  return {
    key,
    data: withNewSections(key, row?.data ?? {}),
    version: row?.version ?? 0,
    updatedAt: (row?.updated_at ?? new Date()).toISOString(),
    updatedBy: row?.name ?? null,
  };
}

/** All three documents, for rendering the site. */
export async function readAllDocuments(): Promise<Record<DocumentKey, Data>> {
  const rows = await query<{ key: DocumentKey; data: Data }>(`SELECT key, data FROM cms_documents`);
  const out = { ...BUNDLED_DOCUMENTS };
  for (const row of rows) if (isDocumentKey(row.key)) out[row.key] = withNewSections(row.key, row.data);
  return out;
}

export class ConflictError extends Error {}
export class InvalidContentError extends Error {}

export async function saveDocument(
  key: DocumentKey,
  data: unknown,
  baseVersion: number,
  user: User,
  note = "",
): Promise<{ version: number; updatedAt: string; data: Data }> {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new InvalidContentError("المحتوى غير صالح.");
  const clean = sanitizeDocument(data as Data);
  const text = JSON.stringify(clean);
  if (text.length > MAX_BYTES) throw new InvalidContentError("حجم المحتوى أكبر من المسموح.");

  return transaction(async (db) => {
    const current = await db.query<{ version: number }>(`SELECT version FROM cms_documents WHERE key = $1 FOR UPDATE`, [key]);
    const version = current.rows[0]?.version ?? 0;
    if (version !== baseVersion) throw new ConflictError("عدّل شخص آخر هذا المحتوى بعد أن فتحته.");
    const next = version + 1;
    const saved = await db.query<{ updated_at: Date }>(
      `INSERT INTO cms_documents (key, data, version, updated_at, updated_by) VALUES ($1, $2, $3, now(), $4)
       ON CONFLICT (key) DO UPDATE SET data = $2, version = $3, updated_at = now(), updated_by = $4
       RETURNING updated_at`,
      [key, text, next, user.id],
    );
    await db.query(`INSERT INTO cms_revisions (key, version, data, note, author_id) VALUES ($1, $2, $3, $4, $5)`, [
      key,
      next,
      text,
      note.slice(0, 300),
      user.id,
    ]);
    await db.query(
      `DELETE FROM cms_revisions WHERE key = $1 AND id NOT IN
         (SELECT id FROM cms_revisions WHERE key = $1 ORDER BY id DESC LIMIT ${KEEP_REVISIONS})`,
      [key],
    );
    return { version: next, updatedAt: saved.rows[0].updated_at.toISOString(), data: clean };
  });
}

export interface RevisionSummary {
  id: number;
  version: number;
  note: string;
  createdAt: string;
  author: string | null;
}

export async function listRevisions(key: DocumentKey): Promise<RevisionSummary[]> {
  const rows = await query<{ id: number; version: number; note: string; created_at: Date; name: string | null }>(
    `SELECT r.id, r.version, r.note, r.created_at, u.name FROM cms_revisions r
     LEFT JOIN cms_users u ON u.id = r.author_id WHERE r.key = $1 ORDER BY r.id DESC`,
    [key],
  );
  return rows.map((r) => ({ id: r.id, version: r.version, note: r.note, createdAt: r.created_at.toISOString(), author: r.name }));
}

export async function readRevision(id: number): Promise<{ key: DocumentKey; version: number; data: Data } | null> {
  const rows = await query<{ key: DocumentKey; version: number; data: Data }>(`SELECT key, version, data FROM cms_revisions WHERE id = $1`, [id]);
  return rows[0] ?? null;
}
