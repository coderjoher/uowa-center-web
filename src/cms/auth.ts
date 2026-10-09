import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { query } from "./db";

/**
 * Editor accounts and sign-in.
 *
 * Passwords are stored as scrypt hashes with a per-user salt. Signing in
 * creates a random session token: the browser keeps it in an httpOnly,
 * SameSite=Strict cookie, and the database keeps only its SHA-256, so a
 * leaked database cannot be replayed as a session. Sessions last 12 hours;
 * signing out, disabling an account or changing its password ends them.
 *
 * Roles: an "admin" manages accounts as well as content; an "editor"
 * manages content and media.
 */

export type Role = "admin" | "editor";
export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export const SESSION_COOKIE = "uowa_cms";
const SESSION_HOURS = 12;
const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

/** At least 10 characters; returns the problem in Arabic, or null. */
export function passwordProblem(password: string): string | null {
  return password.length < 10 ? "يجب أن تتكون كلمة المرور من 10 أحرف على الأقل." : null;
}

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(userId: number): Promise<{ token: string; expires: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
  await query(`INSERT INTO cms_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`, [tokenHash(token), userId, expires]);
  await query(`UPDATE cms_users SET last_login_at = now() WHERE id = $1`, [userId]);
  /* Housekeeping: drop expired sessions. */
  await query(`DELETE FROM cms_sessions WHERE expires_at < now()`);
  return { token, expires };
}

export async function endSession(token: string | undefined): Promise<void> {
  if (token) await query(`DELETE FROM cms_sessions WHERE token_hash = $1`, [tokenHash(token)]);
}

export async function endSessionsOf(userId: number, exceptToken?: string): Promise<void> {
  await query(`DELETE FROM cms_sessions WHERE user_id = $1 AND token_hash <> $2`, [userId, exceptToken ? tokenHash(exceptToken) : ""]);
}

/** The signed-in user for this request, or null. */
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await query<User>(
    `SELECT u.id, u.email, u.name, u.role FROM cms_sessions s JOIN cms_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND NOT u.disabled`,
    [tokenHash(token)],
  );
  return rows[0] ?? null;
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function userCount(): Promise<number> {
  const rows = await query<{ n: string }>(`SELECT count(*) AS n FROM cms_users`);
  return Number(rows[0]?.n ?? 0);
}

/* Failed sign-ins per address and email: five within 15 minutes locks that
   pair out for the rest of the window. Kept in memory; one server process. */
const failures = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;

export function signInLocked(key: string): boolean {
  const recent = (failures.get(key) ?? []).filter((t) => Date.now() - t < WINDOW_MS);
  failures.set(key, recent);
  return recent.length >= 5;
}

export function recordFailure(key: string): void {
  failures.set(key, [...(failures.get(key) ?? []), Date.now()]);
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
