import { revalidateTag } from "next/cache";

/**
 * Called by Strapi's webhook whenever an editor publishes, unpublishes or
 * deletes an entry (or changes media). It clears the cached CMS content, so
 * the next visit to any page renders the new content.
 *
 * The webhook must send the shared secret in an `x-revalidate-secret`
 * header matching REVALIDATE_SECRET; anything else is refused.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ revalidated: false, error: "unauthorized" }, { status: 401 });
  }
  revalidateTag("strapi", { expire: 0 });
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
