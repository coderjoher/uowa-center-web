"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Json } from "./api";
import { FIELD_LABELS, SECTION_LABELS } from "./labels";
import { DOC_KEYS, same, useCms, type Locale } from "./store";

export type PreviewRef = { k: string; p: (string | number)[] };
export interface PreviewSelection {
  ref: PreviewRef | null;
  media: string | null;
  layer: string | null;
}

const DEVICES = [
  { id: "desktop", label: "سطح المكتب", width: 1440, icon: "▭" },
  { id: "tablet", label: "لوحي", width: 834, icon: "▯" },
  { id: "phone", label: "هاتف", width: 390, icon: "▮" },
] as const;

const LABELS = { ...SECTION_LABELS, ...FIELD_LABELS };

/**
 * The website itself, live, beside the editor (as in Payload's live preview).
 * It shows the editor's unsaved changes: they are sent to the server (for
 * this editor only), then the page refreshes. In "تحرير" mode clicking
 * anything selects it in the editor and double-clicking text edits it in
 * place; in "تصفح" mode the site behaves normally, to move between pages.
 */
export function LivePreview({
  path,
  onSelect,
  onNavigate,
  highlight,
  toolbarExtra,
}: {
  /** The page to show, e.g. /ar/news/some-post. */
  path: string;
  onSelect?: (selection: PreviewSelection) => void;
  onNavigate?: (path: string) => void;
  /** A field or a layer to outline in the page. */
  highlight?: { ref?: PreviewRef | null; layer?: string | null; nonce: number } | null;
  toolbarExtra?: React.ReactNode;
}) {
  const { docs, edit, onError } = useCms();
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("desktop");
  const [mode, setMode] = useState<"edit" | "browse">("edit");
  const [scale, setScale] = useState(1);
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const sent = useRef<Partial<Record<string, Json>>>({});
  const inline = useRef(false);
  const shown = useRef(path);
  const width = DEVICES.find((d) => d.id === device)!.width;

  const send = useCallback((message: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ source: "uowa-cms", ...message }, location.origin);
  }, []);

  /* Push the drafts that changed since last time, then refresh the page. */
  const sync = useCallback(async () => {
    const changed: Record<string, Json> = {};
    for (const key of DOC_KEYS) {
      const draft = docs[key]?.draft;
      if (draft !== undefined && !same(draft, sent.current[key])) changed[key] = draft;
    }
    if (!Object.keys(changed).length) return false;
    await api("/api/admin/preview", { method: "PUT", body: JSON.stringify({ docs: changed }) });
    Object.assign(sent.current, changed);
    return true;
  }, [docs]);

  /* First load: send every draft, then open the page in draft mode. */
  useEffect(() => {
    let live = true;
    try {
      sessionStorage.setItem("uowa-preloaded", "1");
    } catch {}
    sync()
      .catch(onError)
      .finally(() => live && setSrc(`/api/admin/preview/enable?path=${encodeURIComponent(path)}`));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* After each change (debounced), sync and refresh, unless text is being typed in the page itself. */
  useEffect(() => {
    if (!src) return;
    const t = setTimeout(() => {
      sync()
        .then((changed) => changed && !inline.current && send({ type: "refresh" }))
        .catch(onError);
    }, 350);
    return () => clearTimeout(t);
  }, [docs, src, sync, send, onError]);

  /* Another page asked for (e.g. another news item, a new page, or the other
     language): send the drafts first, so a page that exists only in the
     drafts is there when the preview opens it. */
  useEffect(() => {
    if (src && path !== shown.current) {
      shown.current = path;
      sync()
        .catch(onError)
        .finally(() => send({ type: "navigate", path }));
    }
  }, [path, src, send, sync, onError]);

  useEffect(() => send({ type: "mode", mode }), [mode, send]);
  useEffect(() => {
    if (highlight) send({ type: "highlight", ref: highlight.ref ?? null, layer: highlight.layer ?? null });
  }, [highlight, send]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.source !== "uowa-preview") return;
      const msg = e.data as { type: string; [k: string]: unknown };
      if (msg.type === "ready") {
        setLoading(false);
        send({ type: "labels", labels: LABELS });
        send({ type: "mode", mode });
        /* The editor moved on while the preview was loading: catch up. */
        if (msg.path !== shown.current) send({ type: "navigate", path: shown.current });
      } else if (msg.type === "select") onSelect?.({ ref: (msg.ref as PreviewRef) ?? null, media: (msg.media as string) ?? null, layer: (msg.layer as string) ?? null });
      else if (msg.type === "inline-start") {
        inline.current = true;
        const ref = msg.ref as PreviewRef;
        onSelect?.({ ref, media: null, layer: null });
      } else if (msg.type === "inline" || msg.type === "inline-done") {
        const ref = msg.ref as PreviewRef;
        if (ref?.k === "ar" || ref?.k === "en") edit(ref.k as Locale)(ref.p, String(msg.value ?? ""));
        if (msg.type === "inline-done") {
          inline.current = false;
          setTimeout(() => send({ type: "refresh" }), 400);
        }
      } else if (msg.type === "navigated" && typeof msg.path === "string" && msg.path !== shown.current) {
        /* Only navigations the editor made in the page (browse mode), not ours. */
        shown.current = msg.path;
        onNavigate?.(msg.path);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [edit, mode, onNavigate, onSelect, send]);

  /* Fit the chosen device width into the available space. */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, (el.clientWidth - 32) / width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#e7ecf1]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-soft bg-white px-3 py-1.5">
        <div className="flex items-center gap-1" role="group" aria-label="حجم الشاشة">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              title={d.label}
              onClick={() => setDevice(d.id)}
              className={`h-8 cursor-pointer px-2.5 text-[13px] ${device === d.id ? "bg-navy text-white" : "text-navy hover:bg-surface"}`}
            >
              {d.label}
            </button>
          ))}
          <span className="ms-1 text-[12px] text-muted" dir="ltr">
            {width}px · {Math.round(scale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          {toolbarExtra}
          <span className="flex border border-border-soft" role="group" aria-label="وضع المعاينة">
            <button
              type="button"
              onClick={() => setMode("edit")}
              title="انقر أي عنصر لتحديده، وانقر مرتين على نص لتعديله مباشرة"
              className={`h-8 cursor-pointer px-3 text-[13px] ${mode === "edit" ? "bg-gold font-bold text-navy" : "text-navy"}`}
            >
              تحرير
            </button>
            <button
              type="button"
              onClick={() => setMode("browse")}
              title="تصفح الموقع والتنقل بين صفحاته"
              className={`h-8 cursor-pointer px-3 text-[13px] ${mode === "browse" ? "bg-gold font-bold text-navy" : "text-navy"}`}
            >
              تصفح
            </button>
          </span>
          <button type="button" title="إعادة تحميل" onClick={() => send({ type: "refresh" })} className="h-8 cursor-pointer px-2 text-[15px] text-navy hover:bg-surface">
            ↻
          </button>
        </div>
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden">
        {loading ? <p className="absolute inset-x-0 top-6 z-10 text-center text-[13px] text-muted">جارٍ تحميل المعاينة…</p> : null}
        <div className="absolute inset-0 overflow-hidden">
          {/* The page at its real width, scaled down and centred (wider than the space, so not centred by margins). */}
          <div
            className="absolute top-4 bg-white shadow-[0_2px_24px_rgba(17,38,64,0.18)]"
            style={{
              width,
              height: `calc((100% - 32px) / ${scale})`,
              left: "50%",
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            {src ? <iframe ref={frame} src={src} title="معاينة الموقع" className="h-full w-full border-0" /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
