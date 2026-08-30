import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";

/**
 * Every route lives under `app/[lang]`, so a request without a locale prefix
 * has nowhere to land. Send it to the default locale (Arabic), preferring the
 * browser's own preference when it names one we ship.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return;

  const accepted = request.headers.get("accept-language") ?? "";
  const preferred =
    LOCALES.find((locale) =>
      accepted
        .split(",")
        .some((tag) => tag.trim().toLowerCase().startsWith(locale)),
    ) ?? DEFAULT_LOCALE;

  request.nextUrl.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|images|svg|seo|favicon.ico).*)"],
};
