import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";

/**
 * The "Contact Us" / "Learn More" / "See all articles" affordance: label plus a
 * 16x16 diagonal arrow, 10px gap, 8px bottom padding, 1.6px rule. The arrow is
 * mirrored under RTL so it still points away from the text.
 */
export default function UnderlineLink({
  href,
  children,
  className = "",
  tone = "navy",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  tone?: "navy" | "white";
}) {
  const color = tone === "navy" ? "text-navy" : "text-white";
  const rule = tone === "navy" ? "border-navy" : "border-white";
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 border-b-[1.6px] pb-2 ${rule} ${color} ${className}`}
    >
      <span className="font-[family-name:var(--font-heading)] text-[16px] font-bold leading-6">
        {children}
      </span>
      <ArrowUpRightIcon className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" />
    </Link>
  );
}
