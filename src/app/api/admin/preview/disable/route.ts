import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** GET ?path=… → leaves draft mode (the published site again) and opens the page. */
export async function GET(request: Request) {
  (await draftMode()).disable();
  const path = new URL(request.url).searchParams.get("path") ?? "/";
  redirect(path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/");
}
