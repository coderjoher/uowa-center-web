import { Fragment } from "react";
import { isRichText } from "@/lib/rich";

/**
 * Renders text that editors may have formatted in the admin. Plain text is
 * rendered as before, in a <p> with the given classes (one per item for a
 * list of paragraphs). Formatted text (HTML, already sanitised when it was
 * saved, see src/cms/sanitize.ts) is rendered in a .rich block with the same
 * classes, so it keeps the surrounding type style.
 */
export default function RichText({ value, className = "" }: { value: string | string[] | undefined; className?: string }) {
  const items = (Array.isArray(value) ? value : [value]).filter((v): v is string => Boolean(v));
  return (
    <>
      {items.map((item, i) =>
        isRichText(item) ? (
          <div key={i} className={`rich ${className}`} dangerouslySetInnerHTML={{ __html: item }} />
        ) : (
          <Fragment key={i}>
            <p className={className}>{item}</p>
          </Fragment>
        ),
      )}
    </>
  );
}
