import { Pool, type PoolClient, type QueryResultRow } from "pg";
import ar from "../../public/content/ar.json";
import en from "../../public/content/en.json";
import settings from "../../public/content/settings.json";

/**
 * The CMS's storage: a Postgres database named by DATABASE_URL.
 *
 * Tables:
 * - cms_documents: the three content documents ("ar", "en", "settings"), each
 *   one JSON value shaped exactly like the files in public/content, with a
 *   version number that every save increments.
 * - cms_revisions: a copy of a document after every save, with who saved it,
 *   for the history view and restores.
 * - cms_users / cms_sessions: editor accounts and their signed-in sessions.
 * - cms_media: uploaded pictures and videos (the files live in MEDIA_DIR).
 *
 * The tables are created on first use, and an empty database is filled from
 * the bundled JSON, so a fresh install starts with the site's current content.
 */

export const DOCUMENT_KEYS = ["ar", "en", "settings"] as const;
export type DocumentKey = (typeof DOCUMENT_KEYS)[number];

export const BUNDLED_DOCUMENTS: Record<DocumentKey, Record<string, unknown>> = {
  ar: ar as Record<string, unknown>,
  en: en as Record<string, unknown>,
  settings: settings as Record<string, unknown>,
};

export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/* One pool per server process, kept across hot reloads in development. */
const globalForPool = globalThis as unknown as { cmsPool?: Pool; cmsReady?: Promise<void> };

function pool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  globalForPool.cmsPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
  return globalForPool.cmsPool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS cms_users (
  id            serial PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  role          text NOT NULL CHECK (role IN ('admin', 'editor')),
  password_hash text NOT NULL,
  disabled      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE TABLE IF NOT EXISTS cms_sessions (
  token_hash text PRIMARY KEY,
  user_id    integer NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_documents (
  key        text PRIMARY KEY,
  data       jsonb NOT NULL,
  version    integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by integer REFERENCES cms_users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS cms_revisions (
  id         serial PRIMARY KEY,
  key        text NOT NULL,
  version    integer NOT NULL,
  data       jsonb NOT NULL,
  note       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  author_id  integer REFERENCES cms_users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS cms_revisions_key ON cms_revisions (key, id DESC);
CREATE TABLE IF NOT EXISTS cms_media (
  id            serial PRIMARY KEY,
  filename      text NOT NULL UNIQUE,
  original_name text NOT NULL,
  mime          text NOT NULL,
  size          bigint NOT NULL,
  alt           text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  uploaded_by   integer REFERENCES cms_users(id) ON DELETE SET NULL
);
`;

async function prepare(): Promise<void> {
  const client = await pool().connect();
  try {
    /* Several server workers may start at once; only one creates and seeds. */
    await client.query("SELECT pg_advisory_lock(727001)");
    await client.query(SCHEMA);
    for (const key of DOCUMENT_KEYS) {
      await client.query(
        `INSERT INTO cms_documents (key, data) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(BUNDLED_DOCUMENTS[key])],
      );
      /* The starting content is the first entry in each document's history. */
      await client.query(
        `INSERT INTO cms_revisions (key, version, data, note)
         SELECT key, version, data, 'المحتوى الأصلي' FROM cms_documents d
         WHERE key = $1 AND NOT EXISTS (SELECT 1 FROM cms_revisions r WHERE r.key = d.key)`,
        [key],
      );
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(727001)").catch(() => {});
    client.release();
  }
}

/** Resolves once the tables exist and the documents are seeded. */
export function ready(): Promise<void> {
  globalForPool.cmsReady ??= prepare().catch((error) => {
    globalForPool.cmsReady = undefined;
    throw error;
  });
  return globalForPool.cmsReady;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> {
  await ready();
  return (await pool().query<T>(text, values)).rows;
}

/** Runs `work` in one transaction, rolled back if it throws. */
export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  await ready();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
