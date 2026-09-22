/**
 * The eyebrow above every section heading, led by a short gold dash (the
 * emblem's gold). It leans on the `.t-label` primitive rather than inline
 * utilities so the Arabic override in globals.css (which drops the 4.8px
 * tracking and the uppercase transform) can reach it.
 */
export default function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`t-label flex items-center gap-3 ${className}`}>
      <span aria-hidden className="h-0.5 w-6 shrink-0 bg-gold" />
      {children}
    </p>
  );
}
