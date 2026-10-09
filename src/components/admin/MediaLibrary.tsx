"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, errorText, formatDate, formatSize, uploadFile, type MediaItem, type MediaKind } from "./api";
import { btn, card, h1, input, primary, secondary, small } from "./ui";

type KindFilter = "all" | MediaKind;

const DOCUMENT_TYPES =
  "application/pdf,.pdf,.docx,.xlsx,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation";
const ACCEPT: Record<MediaKind, string> = { image: "image/*", video: "video/mp4,video/webm", document: DOCUMENT_TYPES };
const ext = (url: string) => (url.split(".").pop() ?? "").toUpperCase().slice(0, 4);

/** Loads the library and handles uploads; shared by the page and the picker. */
function useMedia() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<{ name: string; progress: number }[]>([]);

  const reload = useCallback(async () => {
    try {
      setItems((await api<{ items: MediaItem[] }>("/api/admin/media")).items);
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void reload(), 0);
    return () => clearTimeout(t);
  }, [reload]);

  const upload = async (files: FileList | File[]): Promise<MediaItem[]> => {
    setError(null);
    const done: MediaItem[] = [];
    for (const file of Array.from(files)) {
      setUploads((u) => [...u, { name: file.name, progress: 0 }]);
      try {
        const item = await uploadFile(file, (p) =>
          setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, progress: p } : x))),
        );
        done.push(item);
        setItems((list) => [item, ...(list ?? [])]);
      } catch (e) {
        setError(`${file.name}: ${errorText(e)}`);
      } finally {
        setUploads((u) => u.filter((x) => x.name !== file.name));
      }
    }
    return done;
  };

  return { items, setItems, error, setError, uploads, upload, reload };
}

function Filters({
  kind,
  setKind,
  search,
  setSearch,
  lockKind,
}: {
  kind: KindFilter;
  setKind: (k: KindFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  lockKind?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {lockKind
        ? null
        : (["all", "image", "video", "document"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`${btn} ${kind === k ? "border-navy font-bold" : ""}`}
            >
              {{ all: "الكل", image: "الصور", video: "الفيديو", document: "المستندات" }[k]}
            </button>
          ))}
      <input className={`${input} h-8 max-w-[260px] py-0 text-[13px]`} placeholder="بحث بالاسم…" value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
  );
}

function UploadButton({ accept, onFiles, label = "رفع ملفات" }: { accept: string; onFiles: (f: FileList) => void; label?: string }) {
  return (
    <label className={`${primary} h-9`}>
      {label}
      <input
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function Progress({ uploads }: { uploads: { name: string; progress: number }[] }) {
  if (!uploads.length) return null;
  return (
    <div className="flex flex-col gap-1">
      {uploads.map((u) => (
        <div key={u.name} className="flex items-center gap-3 text-[13px] text-navy">
          <span className="w-48 truncate">{u.name}</span>
          <span className="h-1.5 flex-1 bg-surface">
            <span className="block h-full bg-gold" style={{ width: `${Math.round(u.progress * 100)}%` }} />
          </span>
          <span className="w-10 text-end">{Math.round(u.progress * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

function Thumb({ item, selected, onClick }: { item: MediaItem; selected?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={item.name}
      className={`group flex cursor-pointer flex-col overflow-hidden border bg-white text-start ${
        selected ? "border-gold ring-2 ring-gold" : "border-border-soft hover:border-navy"
      }`}
    >
      <span className="relative block aspect-[4/3] w-full bg-surface">
        {item.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.alt} loading="lazy" className="h-full w-full object-cover" />
        ) : item.kind === "video" ? (
          <video src={`${item.url}#t=0.1`} muted preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[20px] font-bold text-navy">{ext(item.url)}</span>
        )}
        {item.kind === "video" ? (
          <span className="absolute start-1 top-1 bg-navy px-1.5 text-[11px] text-white">فيديو</span>
        ) : null}
        {item.bundled ? <span className="absolute end-1 top-1 bg-white/90 px-1.5 text-[11px] text-muted">من الموقع</span> : null}
      </span>
      <span className="truncate px-2 py-1 text-[12px] text-navy" dir="auto">
        {item.name}
      </span>
    </button>
  );
}

function useFiltered(items: MediaItem[] | null, kind: KindFilter, search: string) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items ?? []).filter((i) => (kind === "all" || i.kind === kind) && (!q || i.name.toLowerCase().includes(q)));
  }, [items, kind, search]);
}

/** The library page: browse, upload, describe and delete files. */
export function MediaLibrary({ onUnauthorized }: { onUnauthorized: (e: unknown) => boolean }) {
  const media = useMedia();
  const [kind, setKind] = useState<KindFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const shown = useFiltered(media.items, kind, search);

  const select = (item: MediaItem) => {
    setSelected(item);
    setAlt(item.alt);
  };

  const saveAlt = async () => {
    if (!selected?.id) return;
    setBusy(true);
    try {
      await api("/api/admin/media", { method: "PATCH", body: JSON.stringify({ id: selected.id, alt }) });
      media.setItems((list) => list?.map((i) => (i.id === selected.id ? { ...i, alt } : i)) ?? null);
      setSelected({ ...selected, alt });
    } catch (e) {
      if (!onUnauthorized(e)) media.setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected?.id || !window.confirm(`حذف «${selected.name}» نهائيًا؟`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/media?id=${selected.id}`, { method: "DELETE" });
      media.setItems((list) => list?.filter((i) => i.id !== selected.id) ?? null);
      setSelected(null);
    } catch (e) {
      if (!onUnauthorized(e)) media.setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={h1}>مكتبة الوسائط</h1>
        <UploadButton accept={`image/*,video/mp4,video/webm,${DOCUMENT_TYPES}`} onFiles={(f) => void media.upload(f)} />
      </div>
      <p className={small}>
        الصور حتى 15 ميغابايت، والفيديو (MP4 أو WebM) حتى 300 ميغابايت، والمستندات (PDF وWord وExcel وPowerPoint) حتى 50 ميغابايت. الملفات «من الموقع» جزء من الموقع نفسه ولا تُحذف من هنا.
      </p>
      <Filters kind={kind} setKind={setKind} search={search} setSearch={setSearch} />
      <Progress uploads={media.uploads} />
      {media.error ? <p className="border border-danger/40 bg-white p-3 text-[14px] text-danger">{media.error}</p> : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {media.items === null ? <p className={small}>جارٍ التحميل…</p> : null}
          {shown.map((item) => (
            <Thumb key={item.url} item={item} selected={selected?.url === item.url} onClick={() => select(item)} />
          ))}
        </div>
        {selected ? (
          <aside className={`${card} flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-4 lg:w-[320px]`}>
            {selected.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.url} alt={selected.alt} className="max-h-56 w-full bg-surface object-contain" />
            ) : selected.kind === "video" ? (
              <video src={selected.url} controls preload="metadata" className="max-h-56 w-full bg-black" />
            ) : (
              <a href={selected.url} target="_blank" rel="noreferrer" className="flex h-32 w-full items-center justify-center bg-surface text-[28px] font-bold text-navy underline">
                {ext(selected.url)}
              </a>
            )}
            <p className="break-all text-[14px] font-bold text-navy" dir="auto">
              {selected.name}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
              <dt className="text-muted">الرابط</dt>
              <dd className="break-all" dir="ltr">
                {selected.url}
              </dd>
              <dt className="text-muted">الحجم</dt>
              <dd>{formatSize(selected.size)}</dd>
              <dt className="text-muted">رُفع في</dt>
              <dd>{formatDate(selected.createdAt)}</dd>
              <dt className="text-muted">بواسطة</dt>
              <dd>{selected.uploadedBy ?? "—"}</dd>
            </dl>
            <button type="button" className={btn} onClick={() => void navigator.clipboard?.writeText(selected.url)}>
              نسخ الرابط
            </button>
            {selected.id ? (
              <>
                <label className="flex flex-col gap-1">
                  <span className={small}>وصف الملف (للبحث وقارئات الشاشة)</span>
                  <input className={input} value={alt} onChange={(e) => setAlt(e.target.value)} />
                </label>
                <div className="flex gap-2">
                  <button type="button" className={`${secondary} h-9 flex-1`} disabled={busy || alt === selected.alt} onClick={() => void saveAlt()}>
                    حفظ الوصف
                  </button>
                  <button type="button" className={`${secondary} h-9 text-danger`} disabled={busy} onClick={() => void remove()}>
                    حذف
                  </button>
                </div>
              </>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/** A dialog for choosing (or uploading) a picture or video for a field. */
export function MediaPicker({
  kind,
  current,
  onPick,
  onClose,
}: {
  kind: MediaKind;
  current: string;
  onPick: (item: MediaItem) => void;
  onClose: () => void;
}) {
  const media = useMedia();
  const [search, setSearch] = useState("");
  const shown = useFiltered(media.items, kind, search);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90dvh] w-full max-w-[960px] flex-col gap-3 bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[18px] font-bold text-navy">{{ image: "اختيار صورة", video: "اختيار فيديو", document: "اختيار ملف" }[kind]}</h2>
          <div className="flex gap-2">
            <UploadButton
              label={{ image: "رفع صورة", video: "رفع فيديو", document: "رفع ملف" }[kind]}
              accept={ACCEPT[kind]}
              onFiles={async (f) => {
                const [first] = await media.upload(f);
                if (first) onPick(first);
              }}
            />
            <button type="button" className={`${secondary} h-9`} onClick={onClose}>
              إغلاق
            </button>
          </div>
        </div>
        <Filters kind={kind} setKind={() => {}} search={search} setSearch={setSearch} lockKind />
        <Progress uploads={media.uploads} />
        {media.error ? <p className="text-[13px] text-danger">{media.error}</p> : null}
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {media.items === null ? <p className={small}>جارٍ التحميل…</p> : null}
          {shown.map((item) => (
            <Thumb key={item.url} item={item} selected={item.url === current} onClick={() => onPick(item)} />
          ))}
        </div>
      </div>
    </div>
  );
}
