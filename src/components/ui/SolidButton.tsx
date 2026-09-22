import Link from "next/link";

/**
 * Solid CTA. `padding: 10px 40px`, square corners, 44px tall, label in the
 * heading face at 700/16/24. Width is content-driven with a 189px floor so the
 * Arabic and English labels both sit comfortably.
 */
export default function SolidButton({
  href,
  children,
  variant = "navy",
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "navy" | "white" | "gold";
  /** Renders a plain anchor — for mailto: and off-site destinations. */
  external?: boolean;
  className?: string;
}) {
  const tone = {
    navy: "bg-navy text-white",
    white: "bg-white text-navy",
    gold: "bg-gold text-navy",
  }[variant];
  const classes = `inline-flex h-11 min-w-[189px] items-center justify-center px-10 py-2.5 text-center font-[family-name:var(--font-heading)] text-[16px] font-bold leading-6 transition-opacity duration-200 hover:opacity-90 ${tone} ${className}`;

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
