import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

/* Same face as the site: Somar Sans, from the university's own files. */
const somar = localFont({
  variable: "--font-somar",
  display: "swap",
  src: [
    { path: "../../../public/fonts/somar/SomarSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../../public/fonts/somar/SomarSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../../public/fonts/somar/SomarSans-SemiBold.woff2", weight: "700", style: "normal" },
  ],
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
    <html lang="ar" dir="rtl" className={somar.variable}>
      <body className="font-[family-name:var(--font-somar)] text-navy">{children}</body>
    </html>
  );
}
