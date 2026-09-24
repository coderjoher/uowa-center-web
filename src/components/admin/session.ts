import "server-only";
import { cookies } from "next/headers";

/**
 * Admin sign-in state, server side only.
 *
 * Configuration comes from three environment variables set on the host:
 * `ADMIN_PASSWORD` (what editors type in), `ADMIN_SESSION_SECRET` (signs the
 * session cookie; any long random string) and `GITHUB_TOKEN` (a fine-grained
 * token with "Contents: read and write" on the repository, used only by the
 * API routes to read and commit the content files). None of them ever reach
 * the browser.
 *
 * A session is an httpOnly cookie holding an expiry and an HMAC over it,
 * checked on every admin API call. Everything uses Web Crypto so it runs on
 * Node and on edge-style runtimes alike.
 */
export const SESSION_COOKIE = "uowa_admin";
const SESSION_HOURS = 12;

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

async function hmac(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(text)));
}

/** Constant-time comparison of two hex strings of equal length. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function configured(): { ok: true } | { ok: false; missing: string[] } {
  const missing = ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "GITHUB_TOKEN"].filter((k) => !process.env[k]);
  return missing.length ? { ok: false, missing } : { ok: true };
}

export async function passwordMatches(candidate: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  /* Hash both so the comparison is constant-time regardless of length. */
  return same(await sha256(candidate), await sha256(expected));
}

export async function issueSession(): Promise<{ value: string; expires: Date }> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
  const stamp = String(expires.getTime());
  return { value: `${stamp}.${await hmac(secret, stamp)}`, expires };
}

export async function hasSession(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return false;
  const [stamp, sig] = value.split(".");
  if (!stamp || !sig) return false;
  if (Number(stamp) < Date.now()) return false;
  return same(await hmac(secret, stamp), sig);
}

export function githubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return token;
}
