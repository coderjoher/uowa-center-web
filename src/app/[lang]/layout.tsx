import type { Metadata } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import "../globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/ui/Preloader";
import PageTransition from "@/components/ui/PageTransition";
import { LOCALES, dirOf, isLocale } from "@/i18n/config";
import { getContent } from "@/data";

/**
 * Somar Sans, the face the university's main site (uowa.edu.iq) uses for its
 * headings and text, self-hosted from the same files so the centre's site
 * reads as part of it. One family covers both scripts — Arabic and Latin —
 * so both locales use it. The university ships four weights; 700 points at
 * the SemiBold file as well, so `font-bold` renders the real SemiBold cut
 * instead of a synthesised bold, which is what the university's bold is.
 */
const somar = localFont({
  variable: "--font-somar",
  display: "swap",
  src: [
    { path: "../../../public/fonts/somar/SomarSans-Light.woff2", weight: "300", style: "normal" },
    { path: "../../../public/fonts/somar/SomarSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../../public/fonts/somar/SomarSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../../public/fonts/somar/SomarSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../../public/fonts/somar/SomarSans-SemiBold.woff2", weight: "700", style: "normal" },
  ],
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
    icons: { icon: [{ url: "/seo/favicon.svg", type: "image/svg+xml" }] },
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

  const { brand } = getContent(lang);

  return (
    <html lang={lang} dir={dirOf(lang)} className={somar.variable}>
      <head>
        {/* Runs before first paint: returning sessions skip the intro, and a
            first visit pauses the hero's entrance until the intro lifts. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.setAttribute(sessionStorage.getItem('uowa-preloaded')?'data-preloaded':'data-loading','')}catch(e){}",
          }}
        />
      </head>
      <body>
        <SmoothScroll />
        <Preloader brand={brand} />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
