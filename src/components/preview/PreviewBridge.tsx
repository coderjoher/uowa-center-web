"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { VERCEL_STEGA_REGEX, vercelStegaDecode } from "@vercel/stega";

/**
 * Runs inside the admin's live preview (the site in draft mode, in an
 * iframe). It connects the page to the editor around it:
 *
 * - hovering outlines whatever is under the pointer, with its field's name;
 * - a click selects it in the admin (text by the invisible marker every
 *   value carries in draft mode, pictures by their address, and the section
 *   or block around it by its layout position);
 * - a double-click on plain text edits it in place;
 * - the admin asks it to refresh (after each change), to switch between
 *   editing and browsing, to open another page, and to highlight a field.
 *
 * Outside the admin (someone opening the site in draft mode directly) it
 * only shows a bar to leave the preview.
 */

type Ref = { k: string; p: (string | number)[] };
type Box = { top: number; left: number; width: number; height: number; label: string };

const FROM_ADMIN = "uowa-cms";
const TO_ADMIN = "uowa-preview";
const STEGA = new RegExp(VERCEL_STEGA_REGEX.source, "gu");
const clean = (text: string) => text.replace(STEGA, "");

function decode(text: string): Ref | null {
  const value = vercelStegaDecode<Ref>(text);
  return value && typeof value === "object" && typeof value.k === "string" && Array.isArray(value.p) ? value : null;
}

/** The marked text node directly inside an element, if any. */
function ownText(el: Element): { node: Text; ref: Ref } | null {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const ref = decode((node as Text).data);
      if (ref) return { node: node as Text, ref };
    }
  }
  return null;
}

/** A picture's original address (next/image serves it through /_next/image?url=…). */
function mediaSource(el: Element): string | null {
  const raw = el.getAttribute("src") ?? (el as HTMLVideoElement).currentSrc ?? el.querySelector("source")?.getAttribute("src") ?? null;
  if (!raw) return el.tagName === "VIDEO" ? (el.getAttribute("poster") ?? null) : null;
  try {
    const url = new URL(raw, location.href);
    return url.pathname === "/_next/image" ? url.searchParams.get("url") : url.pathname;
  } catch {
    return raw;
  }
}

/** The bounding box of an element, also for `display: contents` wrappers. */
function rectOf(el: Element): DOMRect | null {
  const own = el.getBoundingClientRect();
  if (own.width || own.height) return own;
  let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
  for (const child of Array.from(el.children)) {
    const r = rectOf(child);
    if (!r || (!r.width && !r.height)) continue;
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return top === Infinity ? null : new DOMRect(left, top, right - left, bottom - top);
}

interface Hit {
  el: Element;
  ref: Ref | null;
  media: string | null;
  layer: string | null;
  text: Text | null;
}

/** What the pointer is over: the topmost marked text, else a picture or video, else the section. */
function hitAt(x: number, y: number): Hit | null {
  const stack = document.elementsFromPoint(x, y).filter((el) => !el.closest("[data-preview-ui]"));
  if (!stack.length) return null;
  const layer = stack[0].closest("[data-layer]")?.getAttribute("data-layer") ?? null;
  for (const el of stack) {
    const own = ownText(el);
    if (own) return { el, ref: own.ref, media: null, layer, text: own.node };
    if (el.tagName === "IMG" || el.tagName === "VIDEO") {
      const alt = decode(el.getAttribute("alt") ?? el.getAttribute("aria-label") ?? "");
      return { el, ref: alt, media: mediaSource(el), layer, text: null };
    }
    if (el.hasAttribute("data-layer")) break;
  }
  const layerEl = layer ? document.querySelector(`[data-layer="${layer}"]`) : null;
  return layerEl ? { el: layerEl, ref: null, media: null, layer, text: null } : null;
}

function post(message: Record<string, unknown>) {
  window.parent.postMessage({ source: TO_ADMIN, ...message }, location.origin);
}

export default function PreviewBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const [embedded, setEmbedded] = useState<boolean | null>(null);
  const [hover, setHover] = useState<Box | null>(null);
  const [selected, setSelected] = useState<Box | null>(null);
  const mode = useRef<"edit" | "browse">("edit");
  const labels = useRef<Record<string, string>>({});
  const selection = useRef<{ ref?: Ref | null; layer?: string | null }>({});
  const editing = useRef<{ el: HTMLElement; node: Text; ref: Ref; suffix: string } | null>(null);

  const labelFor = (hit: Hit) => {
    if (hit.ref) {
      const key = [...hit.ref.p].reverse().find((p) => typeof p === "string") as string | undefined;
      return labels.current[key ?? ""] ?? key ?? "";
    }
    if (hit.media) return labels.current.image ?? "صورة";
    return "قسم";
  };

  const boxOf = (el: Element, label: string): Box | null => {
    const r = rectOf(el);
    return r ? { top: r.top, left: r.left, width: r.width, height: r.height, label } : null;
  };

  /* Find the element for a field or a layer, to highlight it. */
  const locate = (ref?: Ref | null, layer?: string | null): Element | null => {
    if (ref) {
      const want = JSON.stringify(ref);
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const found = decode((n as Text).data);
        if (found && JSON.stringify(found) === want && n.parentElement) return n.parentElement;
      }
    }
    return layer ? document.querySelector(`[data-layer="${layer}"]`) : null;
  };

  const refreshSelection = () => {
    const { ref, layer } = selection.current;
    const el = locate(ref, layer);
    setSelected(el ? boxOf(el, "") : null);
  };

  useEffect(() => {
    const inFrame = window.parent !== window;
    const t = setTimeout(() => setEmbedded(inFrame), 0);
    if (!inFrame) return () => clearTimeout(t);
    try {
      sessionStorage.setItem("uowa-preloaded", "1");
    } catch {}

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.source !== FROM_ADMIN) return;
      const msg = e.data as { type: string; [k: string]: unknown };
      if (msg.type === "refresh" && !editing.current) router.refresh();
      else if (msg.type === "mode") mode.current = msg.mode === "browse" ? "browse" : "edit";
      else if (msg.type === "navigate" && typeof msg.path === "string") router.push(msg.path);
      else if (msg.type === "labels") labels.current = (msg.labels as Record<string, string>) ?? {};
      else if (msg.type === "highlight") {
        selection.current = { ref: msg.ref as Ref | null, layer: msg.layer as string | null };
        const el = locate(selection.current.ref, selection.current.layer);
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          setTimeout(refreshSelection, 450);
        } else setSelected(null);
      }
    };

    const onMove = (e: MouseEvent) => {
      if (mode.current !== "edit" || editing.current) return setHover(null);
      const hit = hitAt(e.clientX, e.clientY);
      setHover(hit ? boxOf(hit.text?.parentElement ?? hit.el, labelFor(hit)) : null);
    };

    const onClick = (e: MouseEvent) => {
      if (mode.current !== "edit") return;
      if (editing.current && editing.current.el.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const hit = hitAt(e.clientX, e.clientY);
      if (!hit) return;
      selection.current = { ref: hit.ref, layer: hit.layer };
      setSelected(boxOf(hit.text?.parentElement ?? hit.el, ""));
      post({ type: "select", ref: hit.ref, media: hit.media, layer: hit.layer });
    };

    const finish = () => {
      const current = editing.current;
      if (!current) return;
      editing.current = null;
      const value = clean(current.el.innerText).trim();
      /* Put React's own text node back, holding the new text, so the next
         render finds the page as it left it. */
      current.node.data = value + current.suffix;
      current.el.replaceChildren(current.node);
      current.el.removeAttribute("contenteditable");
      post({ type: "inline-done", ref: current.ref, value });
    };

    const onDoubleClick = (e: MouseEvent) => {
      if (mode.current !== "edit" || editing.current) return;
      const hit = hitAt(e.clientX, e.clientY);
      if (!hit?.text || !hit.ref) return;
      const el = hit.text.parentElement as HTMLElement;
      /* Only an element holding exactly this one text can be edited in place. */
      if (clean(el.textContent ?? "").trim() !== clean(hit.text.data).trim()) return post({ type: "select", ref: hit.ref, layer: hit.layer });
      e.preventDefault();
      const suffix = hit.text.data.slice(clean(hit.text.data).length);
      editing.current = { el, node: hit.text, ref: hit.ref, suffix };
      el.setAttribute("contenteditable", "plaintext-only");
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      setHover(null);
      post({ type: "inline-start", ref: hit.ref });
    };

    const onInput = () => {
      const current = editing.current;
      if (current) post({ type: "inline", ref: current.ref, value: clean(current.el.innerText).trim() });
    };
    const onKey = (e: KeyboardEvent) => {
      if (!editing.current) return;
      if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        finish();
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (editing.current && e.target === editing.current.el) finish();
    };
    const onScroll = () => {
      setHover(null);
      refreshSelection();
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("mousemove", onMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("dblclick", onDoubleClick, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusout", onFocusOut, true);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    post({ type: "ready", path: location.pathname });
    return () => {
      clearTimeout(t);
      window.removeEventListener("message", onMessage);
      document.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("dblclick", onDoubleClick, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusout", onFocusOut, true);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* Tell the admin when the preview moves to another page (not on first load: "ready" covers that). */
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    if (window.parent !== window) post({ type: "navigated", path: pathname });
  }, [pathname]);

  if (embedded === false) {
    return (
      <div data-preview-ui className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-center gap-3 bg-navy px-4 py-2 text-[13px] text-white">
        <span>أنت تشاهد معاينة المسودة.</span>
        <a href={`/api/admin/preview/disable?path=${encodeURIComponent(pathname)}`} className="font-bold text-gold underline">
          الخروج من المعاينة
        </a>
      </div>
    );
  }
  if (!embedded) return null;

  return (
    <div data-preview-ui aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      {selected ? (
        <div className="absolute outline-2 outline-gold [outline-style:solid]" style={{ top: selected.top, left: selected.left, width: selected.width, height: selected.height }} />
      ) : null}
      {hover ? (
        <div className="absolute outline-1 outline-[#3b82f6] [outline-style:dashed]" style={{ top: hover.top, left: hover.left, width: hover.width, height: hover.height }}>
          {hover.label ? (
            <span className="absolute -top-5 start-0 whitespace-nowrap bg-[#3b82f6] px-1.5 text-[11px] leading-5 text-white">{hover.label}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
