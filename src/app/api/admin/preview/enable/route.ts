import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { guard } from "@/cms/http";

export const dynamic = "force-dynamic";

/**
 * GET ?path=/ar/… → turns on draft mode for this browser (signed-in editors
 * only) and opens that page of the site, for the admin's live preview.
 */
export async function GET(request: Request) {
  const user = await guard(request);
  if (user instanceof Response) return user;
  const path = new URL(request.url).searchParams.get("path") ?? "/";
  /* Only paths on this site. */
  const safe = path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/";
  (await draftMode()).enable();
  redirect(safe);
}
