import { revalidatePath } from "next/cache";
import { currentUser, type Role, type User } from "./auth";
import { databaseConfigured } from "./db";

/** Helpers shared by the admin API routes in src/app/api/admin. */

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export const fail = (error: string, status: number) => json({ error }, status);

/**
 * Changes must come from the admin page itself: browsers send Origin on
 * POST/PUT/PATCH/DELETE, and it has to match the host the request was
 * made to. Together with the SameSite=Strict cookie this stops other sites
 * from acting on a signed-in editor's behalf.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Resolves to the signed-in user, or to the error response to return:
 * 503 without a database, 403 for a foreign origin or a missing role,
 * 401 when not signed in.
 */
export async function guard(request: Request, role?: Role): Promise<User | Response> {
  if (!databaseConfigured()) return fail("قاعدة البيانات غير مهيأة على الخادم (DATABASE_URL).", 503);
  if (request.method !== "GET" && !sameOrigin(request)) return fail("طلب من مصدر غير موثوق.", 403);
  const user = await currentUser();
  if (!user) return fail("انتهت الجلسة، سجّل الدخول مجددًا.", 401);
  if (role && user.role !== role) return fail("لا تملك صلاحية هذا الإجراء.", 403);
  return user;
}

export function originAllowed(request: Request): boolean {
  return sameOrigin(request);
}

/** Every page renders from the content documents: refresh them all. */
export function refreshSite(): void {
  revalidatePath("/", "layout");
}

export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    const body = (await request.json()) as unknown;
    return body && typeof body === "object" ? (body as Partial<T>) : {};
  } catch {
    return {};
  }
}

export const sessionCookie = (expires: Date) => ({
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  expires,
});
