/**
 * The eyebrow above every section heading. It leans on the `.t-label`
 * primitive rather than inline utilities so the Arabic override in globals.css
 * (which drops the 4.8px tracking and the uppercase transform) can reach it.
 */
export default function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`t-label ${className}`}>{children}</p>;
}
