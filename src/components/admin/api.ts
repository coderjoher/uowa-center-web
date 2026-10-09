/** Client-side helpers for the admin API (src/app/api/admin). */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type DocKey = "ar" | "en" | "settings";
export type Role = "admin" | "editor";

export interface Me {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface MediaItem {
  id: number | null;
  url: string;
  name: string;
  mime: string;
  kind: "image" | "video";
  size: number;
  alt: string;
  createdAt: string | null;
  uploadedBy: string | null;
  bundled: boolean;
}

/** Thrown when the session has ended; the shell shows the sign-in form. */
export class Unauthorized extends Error {}
/** Thrown on 409: someone else saved first, or an action conflicts. */
export class Conflict extends Error {}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body && !(init.body instanceof Blob) ? { "Content-Type": "application/json", ...(init?.headers ?? {}) } : init?.headers,
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401) throw new Unauthorized(body.error ?? "unauthorized");
  if (res.status === 409) throw new Conflict(body.error ?? "conflict");
  if (!res.ok) throw new Error(body.error ?? res.statusText);
  return body;
}

/** Uploads one file as the request body, reporting progress from 0 to 1. */
export function uploadFile(file: File, onProgress?: (fraction: number) => void): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let body: { item?: MediaItem; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText) as typeof body;
      } catch {}
      if (xhr.status === 401) reject(new Unauthorized(body.error ?? "unauthorized"));
      else if (xhr.status >= 400 || !body.item) reject(new Error(body.error ?? `HTTP ${xhr.status}`));
      else resolve(body.item);
    };
    xhr.onerror = () => reject(new Error("تعذّر الاتصال بالخادم."));
    xhr.send(file);
  });
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} ك.ب`;
  return `${(bytes / 1024 / 1024).toFixed(1)} م.ب`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-IQ", { dateStyle: "medium", timeStyle: "short" });
}
