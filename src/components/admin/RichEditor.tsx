"use client";

import { useEffect, useRef } from "react";
import { isRichText, paragraphsToHtml } from "@/lib/rich";

/**
 * A small word-processor field: bold, italic, underline, a sub-heading,
 * bulleted and numbered lists, alignment (right, centre, left, justified),
 * links, and clearing the formatting. It edits HTML; the server cleans it on
 * save (src/cms/sanitize.ts) and the site renders it with RichText.
 *
 * Text pasted from Word or a web page keeps only that same formatting.
 */

const ALLOWED = new Set(["P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "S", "H2", "H3", "H4", "UL", "OL", "LI", "A", "BLOCKQUOTE"]);

/** Keeps the allowed tags (others are unwrapped), links' href and text alignment. */
function cleanHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as HTMLElement;
      if (["SCRIPT", "STYLE", "META", "LINK", "TITLE", "XML"].includes(el.tagName)) {
        el.remove();
        continue;
      }
      walk(el);
      if (!ALLOWED.has(el.tagName)) {
        el.replaceWith(...Array.from(el.childNodes));
        continue;
      }
      const align = el.style.textAlign;
      const href = el.getAttribute("href");
      for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name);
      if (align && /^(left|right|center|justify|start|end)$/.test(align)) el.style.textAlign = align;
      if (el.tagName === "A" && href && /^(https?:|mailto:|tel:|\/)/.test(href)) el.setAttribute("href", href);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

const isEmpty = (html: string) => !html.replace(/<br\s*\/?>|<\/?(p|div)>|&nbsp;|\s/gi, "");

/** A toolbar button: a browser editing command, or "link" (asks for the address). */
type Command = { label: string; title: string; cmd: string; arg?: string; className?: string };

const GROUPS: Command[][] = [
  [
    { label: "B", title: "عريض", cmd: "bold", className: "font-bold" },
    { label: "I", title: "مائل", cmd: "italic", className: "italic" },
    { label: "U", title: "تسطير", cmd: "underline", className: "underline" },
  ],
  [
    { label: "عنوان", title: "عنوان فرعي", cmd: "formatBlock", arg: "h3" },
    { label: "فقرة", title: "فقرة عادية", cmd: "formatBlock", arg: "p" },
    { label: "نقاط", title: "قائمة نقطية", cmd: "insertUnorderedList" },
    { label: "ترقيم", title: "قائمة مرقمة", cmd: "insertOrderedList" },
  ],
  [
    { label: "⇥", title: "محاذاة لليمين", cmd: "justifyRight" },
    { label: "≡", title: "توسيط", cmd: "justifyCenter" },
    { label: "⇤", title: "محاذاة لليسار", cmd: "justifyLeft" },
    { label: "ضبط", title: "ضبط (Justify)", cmd: "justifyFull" },
  ],
  [
    { label: "رابط", title: "إضافة رابط", cmd: "link" },
    { label: "إزالة الرابط", title: "إزالة الرابط", cmd: "unlink" },
    { label: "مسح التنسيق", title: "مسح التنسيق", cmd: "removeFormat" },
  ],
];

export function RichEditor({
  value,
  onChange,
  dir,
}: {
  /** Plain text or HTML. Plain text is shown as paragraphs, and only turns into HTML once edited. */
  value: string;
  onChange: (html: string) => void;
  dir: "rtl" | "ltr";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = isRichText(value) ? value : paragraphsToHtml(value.split(/\n{2,}/));

  /* Push outside changes (undo, restore, switching section) into the editor,
     but never rewrite it while it already shows that content: rewriting
     would move the caret. */
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== shown) el.innerHTML = shown;
  }, [shown]);

  const emit = () => {
    const html = ref.current?.innerHTML ?? "";
    onChange(isEmpty(html) ? "" : html);
  };

  const run = (c: Command) => {
    let arg = c.arg;
    let cmd = c.cmd;
    if (cmd === "link") {
      const url = window.prompt("الرابط (https://… أو /ar/…):", "https://");
      if (!url || url === "https://") return;
      cmd = "createLink";
      arg = url;
    }
    ref.current?.focus();
    document.execCommand("defaultParagraphSeparator", false, "p");
    document.execCommand(cmd, false, arg);
    emit();
  };

  return (
    <div className="flex flex-col border border-border-soft bg-white focus-within:border-navy">
      <div className="flex flex-wrap items-center gap-1 border-b border-border-soft bg-surface/60 p-1" role="toolbar" aria-label="تنسيق النص">
        {GROUPS.map((group, g) => (
          <span key={g} className="flex gap-1 border-e border-border-soft pe-1 last:border-0">
            {group.map((c) => (
              <button
                key={c.title}
                type="button"
                title={c.title}
                aria-label={c.title}
                /* Keep the text selection while clicking the toolbar. */
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(c)}
                className={`h-7 min-w-7 cursor-pointer px-1.5 text-[13px] text-navy hover:bg-white ${c.className ?? ""}`}
              >
                {c.label}
              </button>
            ))}
          </span>
        ))}
      </div>
      <div
        ref={ref}
        dir={dir}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        className="rich min-h-[120px] px-3 py-2 text-[15px] leading-7 text-navy outline-none"
        onInput={emit}
        onPaste={(e) => {
          e.preventDefault();
          const html = e.clipboardData.getData("text/html");
          const text = e.clipboardData.getData("text/plain");
          document.execCommand(
            "insertHTML",
            false,
            html ? cleanHtml(html) : paragraphsToHtml(text.split(/\r?\n/).filter(Boolean)),
          );
          emit();
        }}
      />
    </div>
  );
}

/** The text of a formatted value, for search results and references. */
export function plainText(value: string): string {
  return isRichText(value) ? value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() : value;
}
