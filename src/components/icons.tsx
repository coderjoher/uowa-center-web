import type { SVGProps } from "react";

/** 16x16 diagonal arrow used in every "Learn More" style link. */
export function ArrowUpRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="none" {...props}>
      <path
        d="M 14 1.5 L 2 1.5 C 1.724 1.5 1.5 1.724 1.5 2 C 1.5 2.276 1.724 2.5 2 2.5 L 12.793 2.5 L 1.647 13.646 C 1.512 13.77 1.456 13.959 1.501 14.137 C 1.545 14.315 1.684 14.454 1.862 14.499 C 2.04 14.544 2.229 14.488 2.353 14.353 L 13.5 3.207 L 13.5 14 C 13.5 14.276 13.724 14.5 14 14.5 C 14.276 14.5 14.5 14.276 14.5 14 L 14.5 2 C 14.5 1.724 14.276 1.5 14 1.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 20x20 thin diagonal arrow used as the FAQ accordion affordance. */
export function ArrowUpRightThinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" {...props}>
      <path
        d="M 18.125 17.5 L 18.125 2.5 C 18.125 2.155 17.845 1.875 17.5 1.875 C 17.155 1.875 16.875 2.155 16.875 2.5 L 16.875 15.991 L 2.942 2.058 C 2.698 1.814 2.302 1.814 2.058 2.058 C 1.936 2.18 1.875 2.34 1.875 2.5 C 1.875 2.66 1.936 2.82 2.058 2.942 L 15.991 16.875 L 2.5 16.875 C 2.155 16.875 1.875 17.155 1.875 17.5 C 1.875 17.845 2.155 18.125 2.5 18.125 L 17.5 18.125 C 17.845 18.125 18.125 17.845 18.125 17.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 18x18 calendar glyph — event date rows. */
export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" width={18} height={18} fill="none" {...props}>
      <path
        d="M15.68 1.406h-1.617V.563A.563.563 0 0 0 12.938.563v.843h-7.875V.563A.563.563 0 0 0 3.938.563v.843H2.32A2.32 2.32 0 0 0 0 3.727V15.68A2.32 2.32 0 0 0 2.32 18h13.36A2.32 2.32 0 0 0 18 15.68V3.727a2.32 2.32 0 0 0-2.32-2.32Zm-13.36 1.125h1.618v.563a.563.563 0 0 0 1.125 0v-.563h7.875v.563a.563.563 0 0 0 1.125 0v-.563h1.617c.66 0 1.195.535 1.195 1.196v1.336H1.125V3.727c0-.66.535-1.196 1.195-1.196Zm13.36 14.344H2.32c-.66 0-1.195-.535-1.195-1.195V6.188h15.75v9.492c0 .66-.535 1.195-1.195 1.195Z"
        fill="currentColor"
      />
      <path
        d="M5.203 8.016H3.797a.563.563 0 0 0 0 1.125h1.406a.563.563 0 0 0 0-1.125Zm4.5 0H8.297a.563.563 0 0 0 0 1.125h1.406a.563.563 0 0 0 0-1.125Zm4.5 0h-1.406a.563.563 0 0 0 0 1.125h1.406a.563.563 0 0 0 0-1.125Zm-9 3.234H3.797a.563.563 0 0 0 0 1.125h1.406a.563.563 0 0 0 0-1.125Zm4.5 0H8.297a.563.563 0 0 0 0 1.125h1.406a.563.563 0 0 0 0-1.125Zm4.5 0h-1.406a.563.563 0 0 0 0 1.125h1.406a.563.563 0 0 0 0-1.125Zm-9 3.234H3.797a.563.563 0 0 0 0 1.125h1.406a.563.563 0 0 0 0-1.125Zm4.5 0H8.297a.563.563 0 0 0 0 1.125h1.406a.563.563 0 0 0 0-1.125Zm4.5 0h-1.406a.563.563 0 0 0 0 1.125h1.406a.563.563 0 0 0 0-1.125Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 20x20 map pin — event venue rows. */
export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" {...props}>
      <path
        d="M 10 0 C 5.926 0 2.612 3.314 2.612 7.388 C 2.612 8.729 3.213 10.172 3.239 10.232 C 3.433 10.694 3.816 11.41 4.093 11.83 L 9.158 19.505 C 9.366 19.82 9.672 20 10 20 C 10.328 20 10.634 19.82 10.842 19.505 L 15.908 11.83 C 16.185 11.41 16.568 10.694 16.762 10.232 C 16.787 10.172 17.388 8.73 17.388 7.388 C 17.388 3.314 14.074 0 10 0 Z M 15.96 9.895 C 15.787 10.309 15.43 10.975 15.182 11.351 L 10.116 19.027 C 10.016 19.179 9.984 19.179 9.884 19.027 L 4.818 11.351 C 4.57 10.975 4.213 10.308 4.04 9.895 C 4.033 9.877 3.481 8.549 3.481 7.388 C 3.481 3.794 6.406 0.869 10 0.869 C 13.595 0.869 16.519 3.794 16.519 7.388 C 16.519 8.551 15.966 9.882 15.96 9.895 Z"
        fill="currentColor"
      />
      <path
        d="M10 3.7a3.69 3.69 0 1 0 0 7.38 3.69 3.69 0 0 0 0-7.38Zm0 6.51a2.82 2.82 0 1 1 0-5.64 2.82 2.82 0 0 1 0 5.64Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Chevron used by the "Programs" nav item. */
export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 14 14" width={14} height={14} fill="none" {...props}>
      <path
        d="M 3 5.5 L 7 9.5 L 11 5.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Carousel arrows (alumni) — 40x40, 2px white chevron, exactly as shipped. */
export function CarouselArrowIcon({
  direction = "right",
  ...props
}: SVGProps<SVGSVGElement> & { direction?: "left" | "right" }) {
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" fill="none" {...props}>
      <path
        d={direction === "right" ? "M17.5 12.5 25 20l-7.5 7.5" : "M22.5 12.5 15 20l7.5 7.5"}
        fill="transparent"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

/**
 * 16x16 hairline crosshair that prefixes each nested item in the mobile menu.
 * Four bars with a 2px gap at the centre.
 */
export function MenuBulletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="none" {...props}>
      <path
        d="M 7.837 16 L 7.837 9.034 L 8.163 9.034 L 8.163 16 Z M 7.837 6.966 L 7.837 0 L 8.163 0 L 8.163 6.966 Z M 0 7.837 L 6.966 7.837 L 6.966 8.163 L 0 8.163 Z M 9.034 7.837 L 16 7.837 L 16 8.163 L 9.034 8.163 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ==========================================================================
   Feature icons — 64x64, white disc with a #15283d hairline, glyph drawn in
   the same 1px round-cap stroke as the rest of the set.
   ========================================================================== */
function FeatureFrame({
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" width={64} height={64} fill="none" {...props}>
      <circle cx="32" cy="32" r="31.5" fill="#fff" stroke="#15283D" />
      <g
        stroke="#15283D"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        {children}
      </g>
    </svg>
  );
}

/** Campus network: a hub node wired to three peers. */
export function NetworkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <FeatureFrame {...props}>
      <path d="M32 23.5v5M29.2 34.4l-4.6 2.6M34.8 34.4l4.6 2.6" />
      <circle cx="32" cy="32" r="4" />
      <circle cx="32" cy="20" r="3" />
      <circle cx="21.6" cy="38" r="3" />
      <circle cx="42.4" cy="38" r="3" />
    </FeatureFrame>
  );
}

/** Specialised staff: two figures. */
export function TeamIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <FeatureFrame {...props}>
      <circle cx="27" cy="25" r="5" />
      <path d="M18 44.5c0-5 4-9 9-9s9 4 9 9" />
      <circle cx="40.5" cy="27.5" r="3.8" />
      <path d="M38.5 36.5c4.4 0 7.5 3.4 7.5 7.5" />
    </FeatureFrame>
  );
}

/** Help desk: headset with a mic boom. */
export function SupportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <FeatureFrame {...props}>
      <path d="M20 34.5v-2.5a12 12 0 0 1 24 0v2.5" />
      <rect x="16.5" y="33" width="6" height="10.5" rx="3" />
      <rect x="41.5" y="33" width="6" height="10.5" rx="3" />
      <path d="M44.5 43.5v1a4 4 0 0 1-4 4h-4.5" />
    </FeatureFrame>
  );
}

const FEATURE_ICONS = {
  network: NetworkIcon,
  team: TeamIcon,
  support: SupportIcon,
} as const;

export function FeatureIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof FEATURE_ICONS }) {
  const Icon = FEATURE_ICONS[name];
  return <Icon {...props} />;
}
