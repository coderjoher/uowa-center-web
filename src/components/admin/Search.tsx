"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Json } from "./api";
import type { Path } from "./Editor";
import { SECTION_LABELS, labelFor } from "./labels";
import { plainText } from "./RichEditor";

export interface SearchHit {
  locale: "ar" | "en";
  path: Path;
  text: string;
  where: string;
}

/**
 * Folds the differences that shouldn't stop a match: case, Arabic
 * diacritics and tatweel, and the variant forms of alef, ya and ta marbuta.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

const ZONE_LABELS: Record<string, string> = { afterHero: "بعد الصورة الرئيسية", beforeFooter: "قبل التذييل" };

/** "Section › field › #2 › field", for a result's location. */
function describe(doc: Json, path: Path): string {
  const parts: string[] = [];
  let cur: Json | undefined = doc;
  path.forEach((key, i) => {
    const prev = path[i - 1];
    if (i === 0) parts.push(key === "customPages" ? "الصفحات" : key === "homeBlocks" ? "أقسام إضافية في الرئيسية" : SECTION_LABELS[key as string] ?? String(key));
    else if (prev === "customPages" && typeof key === "number") {
      const page = (cur as Json[] | undefined)?.[key] as { title?: string } | undefined;
      parts.push(page?.title || `#${key + 1}`);
    } else if (prev === "homeBlocks") parts.push(ZONE_LABELS[key as string] ?? String(key));
    else if (typeof key === "number") parts.push(`#${key + 1}`);
    else parts.push(labelFor(key));
    cur = cur && typeof cur === "object" ? (cur as { [k: string]: Json })[key as string] : undefined;
  });
  return parts.join(" › ");
}

function collect(doc: Json, locale: "ar" | "en", needle: string, out: SearchHit[]) {
  const walk = (value: Json, path: Path) => {
    if (out.length >= 60) return;
    if (typeof value === "string") {
      const text = plainText(value);
      if (text && normalize(text).includes(needle)) out.push({ locale, path, text, where: describe(doc, path) });
      return;
    }
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, [...path, i]));
    else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) if (k !== "type") walk(v, [...path, k]);
    }
  };
  walk(doc, []);
}

function Snippet({ text, query }: { text: string; query: string }) {
  /* Show the match with some text around it; highlight when the raw text matches. */
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return <>{text.length > 120 ? `${text.slice(0, 120)}…` : text}</>;
  const start = Math.max(0, at - 40);
  return (
    <>
      {start > 0 ? "…" : ""}
      {text.slice(start, at)}
      <mark className="bg-gold/50 text-navy">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length, at + query.length + 70)}
      {at + query.length + 70 < text.length ? "…" : ""}
    </>
  );
}

/** The search box in the admin's header: finds any text in either language and jumps to it. */
export function Search({ docs, onPick }: { docs: { ar?: Json; en?: Json }; onPick: (hit: SearchHit) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => {
    const needle = normalize(query.trim());
    if (needle.length < 2) return [];
    const out: SearchHit[] = [];
    if (docs.ar) collect(docs.ar, "ar", needle, out);
    if (docs.en) collect(docs.en, "en", needle, out);
    return out;
  }, [docs.ar, docs.en, query]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative min-w-0 max-w-[420px] flex-1">
      <input
        type="search"
        value={query}
        placeholder="بحث في كل المحتوى…"
        aria-label="بحث في كل المحتوى"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="h-9 w-full border border-border-soft bg-surface px-3 text-[14px] text-navy outline-none focus:border-navy focus:bg-white"
      />
      {open && query.trim().length >= 2 ? (
        <div className="absolute inset-x-0 top-full z-40 mt-1 max-h-[70dvh] overflow-y-auto border border-border-soft bg-white shadow-lg">
          {hits.length === 0 ? <p className="p-3 text-[13px] text-muted">لا نتائج.</p> : null}
          {hits.map((hit, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onPick(hit);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer flex-col items-start gap-0.5 border-b border-border-soft px-3 py-2 text-start hover:bg-surface"
            >
              <span className="flex items-center gap-2 text-[12px] text-muted">
                <span className="bg-navy px-1.5 text-[11px] text-white">{hit.locale === "ar" ? "ع" : "EN"}</span>
                {hit.where}
              </span>
              <span className="text-[13px] leading-5 text-navy" dir="auto">
                <Snippet text={hit.text} query={query.trim()} />
              </span>
            </button>
          ))}
          {hits.length >= 60 ? <p className="p-2 text-[12px] text-muted">تظهر أول 60 نتيجة؛ اكتب كلمات أكثر لتضييق البحث.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
