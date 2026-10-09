import { refreshSite } from "@/cms/http";

/**
 * Re-renders every page from the current content. The Docker image's start
 * script calls it once on boot (the pages baked in at build time were
 * rendered without the database). Requires the REVALIDATE_SECRET in an
 * `x-revalidate-secret` header.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ revalidated: false, error: "unauthorized" }, { status: 401 });
  }
  refreshSite();
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
