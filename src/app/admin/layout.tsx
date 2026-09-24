import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "../globals.css";

const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "لوحة تحكم المحتوى",
  robots: { index: false, follow: false },
};

/**
 * Own root layout for the admin, outside `[lang]`: Arabic UI, no site chrome,
 * no intro or page transitions, and kept out of search engines.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body className="font-[family-name:var(--font-plex-arabic)] text-navy">{children}</body>
    </html>
  );
}
