import { createWriteStream } from "node:fs";
import { mkdir, readdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { query } from "./db";
import { readAllDocuments } from "./content";
import type { User } from "./auth";

/**
 * Uploaded pictures, videos and documents (guides, policies, reports).
 *
 * Files are written to MEDIA_DIR (a Docker volume in production; `.media/`
 * in the project during development) under a unique name, recorded in
 * cms_media, and served at `/media/<name>` by src/app/media/[name]/route.ts.
 * The library also lists the pictures and videos that ship with the site
 * (public/images, public/videos) so editors can reuse them; those can't be
 * deleted from the admin.
 */

/* Runtime data, not code: the ignore comments keep Next's file tracer from
   copying the whole project into the server bundle. */
export const MEDIA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.MEDIA_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), ".media"));
export const MEDIA_ROUTE = "/media/";

/** The file on disk for an upload's name (already checked with safeName). */
export const mediaPath = (name: string) => path.join(/*turbopackIgnore: true*/ MEDIA_DIR, name);

export type MediaKind = "image" | "video" | "document";

export const TYPES: Record<string, { ext: string; kind: MediaKind; max: number }> = {
  "image/jpeg": { ext: "jpg", kind: "image", max: 15 * 1024 * 1024 },
  "image/png": { ext: "png", kind: "image", max: 15 * 1024 * 1024 },
  "image/webp": { ext: "webp", kind: "image", max: 15 * 1024 * 1024 },
  "image/avif": { ext: "avif", kind: "image", max: 15 * 1024 * 1024 },
  "image/gif": { ext: "gif", kind: "image", max: 15 * 1024 * 1024 },
  "image/svg+xml": { ext: "svg", kind: "image", max: 2 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", kind: "video", max: 300 * 1024 * 1024 },
  "video/webm": { ext: "webm", kind: "video", max: 300 * 1024 * 1024 },
  "application/pdf": { ext: "pdf", kind: "document", max: 50 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "docx", kind: "document", max: 50 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: "xlsx", kind: "document", max: 50 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { ext: "pptx", kind: "document", max: 50 * 1024 * 1024 },
};

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(TYPES).map(([mime, t]) => [t.ext, mime]),
);
MIME_BY_EXT.jpeg = "image/jpeg";

export class MediaError extends Error {}

export interface MediaItem {
  id: number | null;
  url: string;
  name: string;
  mime: string;
  kind: MediaKind;
  size: number;
  alt: string;
  createdAt: string | null;
  uploadedBy: string | null;
  bundled: boolean;
}

/** Only plain file names made of safe characters; never a path. */
export function safeName(name: string): string | null {
  return /^[a-z0-9][a-z0-9._-]{0,150}$/i.test(name) && !name.includes("..") ? name : null;
}

export async function saveUpload(
  body: WebReadableStream<Uint8Array> | null,
  mime: string,
  originalName: string,
  user: User,
): Promise<MediaItem> {
  const type = TYPES[mime];
  if (!type) throw new MediaError("نوع الملف غير مدعوم. المسموح: الصور (JPG وPNG وWebP وAVIF وGIF وSVG) والفيديو (MP4 وWebM) والمستندات (PDF وWord وExcel وPowerPoint).");
  if (!body) throw new MediaError("لم يصل أي ملف.");

  const stem =
    originalName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || type.kind;
  const filename = `${Date.now().toString(36)}-${stem}.${type.ext}`;
  await mkdir(MEDIA_DIR, { recursive: true });
  const partial = mediaPath(`.${filename}.part`);

  let size = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _enc, done) {
      size += chunk.length;
      if (size > type.max) done(new MediaError(`حجم الملف أكبر من ${Math.round(type.max / 1024 / 1024)} ميغابايت.`));
      else done(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(body), limit, createWriteStream(partial));
    if (size === 0) throw new MediaError("الملف فارغ.");
    await rename(partial, mediaPath(filename));
  } catch (error) {
    await unlink(partial).catch(() => {});
    throw error;
  }

  const rows = await query<{ id: number; created_at: Date }>(
    `INSERT INTO cms_media (filename, original_name, mime, size, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
    [filename, originalName.slice(0, 200), mime, size, user.id],
  );
  return {
    id: rows[0].id,
    url: MEDIA_ROUTE + filename,
    name: originalName,
    mime,
    kind: type.kind,
    size,
    alt: "",
    createdAt: rows[0].created_at.toISOString(),
    uploadedBy: user.name,
    bundled: false,
  };
}

async function bundledFiles(): Promise<MediaItem[]> {
  const out: MediaItem[] = [];
  for (const dir of ["images", "videos", "files"]) {
    const root = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", dir);
    let names: string[] = [];
    try {
      names = await readdir(root, { recursive: true });
    } catch {
      continue;
    }
    for (const name of names.sort()) {
      const mime = MIME_BY_EXT[name.split(".").pop()?.toLowerCase() ?? ""];
      if (!mime) continue;
      const info = await stat(path.join(/*turbopackIgnore: true*/ root, name)).catch(() => null);
      if (!info?.isFile()) continue;
      out.push({
        id: null,
        url: `/${dir}/${name.split(path.sep).join("/")}`,
        name,
        mime,
        kind: TYPES[mime].kind,
        size: info.size,
        alt: "",
        createdAt: null,
        uploadedBy: null,
        bundled: true,
      });
    }
  }
  return out;
}

export async function listMedia(): Promise<MediaItem[]> {
  const rows = await query<{
    id: number;
    filename: string;
    original_name: string;
    mime: string;
    size: string;
    alt: string;
    created_at: Date;
    name: string | null;
  }>(
    `SELECT m.id, m.filename, m.original_name, m.mime, m.size, m.alt, m.created_at, u.name
     FROM cms_media m LEFT JOIN cms_users u ON u.id = m.uploaded_by ORDER BY m.id DESC`,
  );
  const uploaded: MediaItem[] = rows.map((r) => ({
    id: r.id,
    url: MEDIA_ROUTE + r.filename,
    name: r.original_name,
    mime: r.mime,
    kind: TYPES[r.mime]?.kind ?? "image",
    size: Number(r.size),
    alt: r.alt,
    createdAt: r.created_at.toISOString(),
    uploadedBy: r.name,
    bundled: false,
  }));
  return [...uploaded, ...(await bundledFiles())];
}

/** Where a file is used: the document keys whose content mentions its URL. */
export async function usageOf(url: string): Promise<string[]> {
  const docs = await readAllDocuments();
  return Object.entries(docs)
    .filter(([, data]) => JSON.stringify(data).includes(`"${url}"`))
    .map(([key]) => key);
}

export async function updateAlt(id: number, alt: string): Promise<void> {
  await query(`UPDATE cms_media SET alt = $2 WHERE id = $1`, [id, alt.slice(0, 300)]);
}

export async function deleteMedia(id: number): Promise<void> {
  const rows = await query<{ filename: string }>(`SELECT filename FROM cms_media WHERE id = $1`, [id]);
  const file = rows[0];
  if (!file) return;
  const used = await usageOf(MEDIA_ROUTE + file.filename);
  if (used.length) throw new MediaError("الملف مستخدم في المحتوى. أزله من المحتوى أولًا ثم احذفه.");
  await query(`DELETE FROM cms_media WHERE id = $1`, [id]);
  await unlink(mediaPath(file.filename)).catch(() => {});
}
