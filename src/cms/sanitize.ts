import sanitizeHtml from "sanitize-html";
import { isRichText } from "@/lib/rich";

/**
 * Cleans formatted text before it is stored: only the tags the admin's
 * formatting toolbar produces survive, links are limited to safe schemes,
 * and the only style kept is text alignment. Everything the site renders as
 * HTML has been through here, so it can be inserted as is.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "div", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote", "span"],
  allowedAttributes: { a: ["href", "target", "rel"], "*": ["style"] },
  allowedStyles: { "*": { "text-align": [/^(left|right|center|justify|start|end)$/] } },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  transformTags: {
    b: "strong",
    i: "em",
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
      },
    }),
  },
};

export function sanitizeRich(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}

/** Sanitises every formatted string anywhere in a content document. */
export function sanitizeDocument<T>(value: T): T {
  if (typeof value === "string" && isRichText(value)) return sanitizeRich(value) as T;
  if (Array.isArray(value)) return value.map(sanitizeDocument) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeDocument(v)])) as T;
  }
  return value;
}
