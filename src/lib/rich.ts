/**
 * Formatted text. Editors can format paragraphs in the admin (bold, lists,
 * alignment…); such values are stored as HTML. A value counts as HTML when
 * it contains a tag, so plain text, including text with a stray "<", stays
 * plain. Safe on the server and in the browser.
 */
const TAG = /<\/?[a-z][a-z0-9]*(\s[^<>]*)?\/?>/i;

export function isRichText(value: unknown): boolean {
  return typeof value === "string" && TAG.test(value);
}

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain paragraphs as HTML, for loading them into the formatting editor. */
export function paragraphsToHtml(value: string | string[]): string {
  const items = Array.isArray(value) ? value : [value];
  return items.map((p) => (isRichText(p) ? p : p ? `<p>${escape(p)}</p>` : "")).join("");
}
