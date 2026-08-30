import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cairo, IBM_Plex_Sans_Arabic, Inter, Merriweather } from "next/font/google";
import localFont from "next/font/local";
import "../globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { LOCALES, dirOf, isLocale } from "@/i18n/config";
import { getContent } from "@/data";

/* Latin ------------------------------------------------------------------- */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

/* Arabic ------------------------------------------------------------------ */
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

/**
 * KO Sans carries the Arabic headings. It is an Arabic-only face — 281 glyphs
 * with full init/medi/fina/isol shaping, Arabic and ASCII digits and basic
 * punctuation, but no Latin letters at all — so it is layered over Cairo rather
 * than replacing it, and never loaded on the English page.
 *
 * The OTFs ship one family name per weight ("KO Sans Bold"), so each file is
 * declared separately here to collapse them into a single weighted family.
 */
const koSans = localFont({
  variable: "--font-ko-sans",
  display: "swap",
  src: [
    { path: "../../../public/fonts/ko-sans/KOSans-Light.otf", weight: "300", style: "normal" },
    { path: "../../../public/fonts/ko-sans/KOSans-Regular.otf", weight: "400", style: "normal" },
    { path: "../../../public/fonts/ko-sans/KOSans-Medium.otf", weight: "500", style: "normal" },
    { path: "../../../public/fonts/ko-sans/KOSans-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../../../public/fonts/ko-sans/KOSans-Bold.otf", weight: "700", style: "normal" },
  ],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const { meta } = getContent(lang);
  const url = `https://uowa.edu.iq/${lang}`;

  return {
    metadataBase: new URL("https://uowa.edu.iq"),
    title: meta.title,
    description: meta.description,
    icons: { icon: "/seo/favicon.svg" },
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: "website",
      locale: lang === "ar" ? "ar_IQ" : "en_US",
      title: meta.title,
      description: meta.description,
      url,
      images: ["/seo/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/seo/og-image.jpg"],
    },
    robots: { "max-image-preview": "large" } as Metadata["robots"],
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  // Only the active script's faces are attached, so the other language's fonts
  // are never preloaded on a page that cannot use them.
  const fonts =
    lang === "ar"
      ? `${koSans.variable} ${cairo.variable} ${plexArabic.variable}`
      : `${inter.variable} ${merriweather.variable}`;

  return (
    <html lang={lang} dir={dirOf(lang)} className={fonts}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
