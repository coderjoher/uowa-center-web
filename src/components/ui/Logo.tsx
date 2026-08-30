import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/**
 * University emblem + the centre's name. The emblem ships in two tones because
 * it sits on white in the navbar and on navy in the footer and open menu.
 */
export default function Logo({
  lang,
  brand,
  tone = "navy",
  className = "",
}: {
  lang: Locale;
  brand: SiteContent["brand"];
  tone?: "navy" | "white";
  className?: string;
}) {
  return (
    <Link
      href={`/${lang}`}
      className={`inline-flex items-center gap-2.5 transition-colors duration-300 ${
        tone === "navy" ? "text-navy" : "text-white"
      } ${className}`}
    >
      <Image
        src={tone === "navy" ? "/svg/uowa-mark-navy.svg" : "/svg/uowa-mark-white.svg"}
        alt={brand.logoAlt}
        width={23}
        height={36}
        priority
        className="h-9 w-auto shrink-0"
      />
      <span className="font-[family-name:var(--font-heading)] text-[18px] leading-tight xl:text-[22px]">
        <span className="font-bold">{brand.name}</span>{" "}
        <span className="font-light">{brand.suffix}</span>
      </span>
    </Link>
  );
}
