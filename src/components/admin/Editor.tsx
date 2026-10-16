"use client";

import { useState } from "react";
import { errorText, uploadFile, type Json, type MediaItem, type MediaKind } from "./api";
import { FILE_KEYS, IMAGE_KEYS, LONG_KEYS, RICH_KEYS, VIDEO_KEYS, labelFor } from "./labels";
import { MediaPicker } from "./MediaLibrary";
import { RichEditor, plainText } from "./RichEditor";
import { paragraphsToHtml } from "@/lib/rich";
import { IMAGE_HINT } from "./images";
import { btn, input, small } from "./ui";

export type Path = (string | number)[];

/** Immutable set at a path. */
export function setAt(root: Json, path: Path, value: Json): Json {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = root.slice();
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy;
  }
  const obj = { ...(root as { [k: string]: Json }) };
  obj[head as string] = setAt(obj[head as string], rest, value);
  return obj;
}

/** The value at a path, if there is one. */
export function getAt(root: Json | undefined, path: Path): Json | undefined {
  let cur = root;
  for (const key of path) cur = child(cur, key);
  return cur;
}

/** The value at `key` of an object or list, if `value` is one. */
function child(value: Json | undefined, key: string | number): Json | undefined {
  if (value && typeof value === "object") return (value as { [k: string]: Json })[key as string];
  return undefined;
}

/** Identifies a field in the page, for jumping to it from the search. */
export const pathKey = (path: Path) => JSON.stringify(path);

const startsWith = (path: Path, prefix: Path) => prefix.length <= path.length && prefix.every((p, i) => p === path[i]);

/** A blank copy of a value: strings emptied, numbers zeroed, arrays kept to one blank item. */
export function blank(value: Json): Json {
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (value === null) return null;
  if (Array.isArray(value)) return value.length ? [blank(value[0])] : [];
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blank(v)]));
}

/**
 * Every item of a list shown with every field any item of the list has, so
 * a field filled on one item (a team member's photo, say) can be filled on
 * the others too, even where their stored data never had it. Missing fields
 * start empty.
 */
export function withSiblingFields(item: Json, siblings: Json[]): [string, Json][] {
  const own = item && typeof item === "object" && !Array.isArray(item) ? (item as { [k: string]: Json }) : {};
  const out: [string, Json][] = Object.entries(own);
  const seen = new Set(Object.keys(own));
  for (const sibling of siblings) {
    if (!sibling || typeof sibling !== "object" || Array.isArray(sibling)) continue;
    for (const [k, v] of Object.entries(sibling)) {
      if (seen.has(k)) continue;
      seen.add(k);
      out.push([k, blank(v)]);
    }
  }
  return out;
}

/** A short description of an object in a list, for its card header. */
export function summarize(value: Json): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return plainText(String(value ?? ""));
  for (const k of ["title", "name", "label", "question", "year", "caption", "heading", "date", "activity", "value"]) {
    const v = value[k];
    if (typeof v === "string" && v) return plainText(v);
    if (Array.isArray(v) && typeof v[0] === "string") return v.join(" ");
  }
  return "";
}

export interface EditorContext {
  /** Text direction of the language being edited. */
  dir: "rtl" | "ltr";
  /** Label of the other language, when its text is shown as a reference. */
  referenceLabel?: string;
  /** A field the search jumped to: groups on its way open up. */
  focus?: Path;
  /** Lets a screen render some fields its own way (e.g. a list managed as a collection). */
  override?: (path: Path, value: Json, name: string) => React.ReactNode | undefined;
}

interface FieldProps {
  name: string;
  value: Json;
  /** The same field in the other language, shown under text inputs. */
  reference?: Json;
  path: Path;
  onChange: (path: Path, value: Json) => void;
  ctx: EditorContext;
  depth?: number;
}

function Key({ name }: { name: string }) {
  return (
    <span dir="ltr" className="font-normal opacity-60">
      ({name})
    </span>
  );
}

function Reference({ value, ctx }: { value: Json | undefined; ctx: EditorContext }) {
  const text = typeof value === "string" ? plainText(value) : Array.isArray(value) ? value.filter((v) => typeof v === "string").map((v) => plainText(v as string)).join(" ") : "";
  if (!text || !ctx.referenceLabel) return null;
  return (
    <span className="text-[12px] leading-5 text-muted" dir="auto">
      <span className="font-bold">{ctx.referenceLabel}:</span> {text}
    </span>
  );
}

const isStringList = (v: Json): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/** Keys holding a list of pictures: edited as a gallery, any number at once. */
export const GALLERY_KEYS = new Set(["images"]);

/** Which keys hold a picture, a video or a document, by name. */
export function mediaKind(name: string): MediaKind | null {
  if (VIDEO_KEYS.has(name) || /Video$|^video$|Webm$/.test(name)) return "video";
  if (FILE_KEYS.has(name)) return "document";
  if (IMAGE_KEYS.has(name) || /Image$/.test(name)) return "image";
  return null;
}

/**
 * Renders any JSON value as a form, by shape: strings become inputs (a
 * textarea for paragraph keys, the formatting editor for text that can be
 * formatted, the media picker for picture, video and document keys),
 * numbers and booleans their controls, arrays lists with add/remove/reorder,
 * objects collapsible groups. Every edit reports the full path so the
 * document is updated immutably at the root.
 */
export function Field({ name, value, reference, path, onChange, ctx, depth = 0 }: FieldProps) {
  const label = labelFor(name);
  const custom = ctx.override?.(path, value, name);
  if (custom !== undefined) return <>{custom}</>;

  if (GALLERY_KEYS.has(name) && isStringList(value)) {
    return (
      <div data-path={pathKey(path)}>
        <MultiImageField label={label} name={name} value={value} onChange={(v) => onChange(path, v)} />
      </div>
    );
  }

  if (RICH_KEYS.has(name) && (typeof value === "string" || isStringList(value))) {
    /* A list of paragraphs is edited as one formatted text, stored as one item. */
    const text = typeof value === "string" ? value : paragraphsToHtml(value.filter(Boolean));
    return (
      <div className="flex flex-col gap-1" data-path={pathKey(path)}>
        <span className={small}>
          {label} <Key name={name} />
        </span>
        <RichEditor
          value={typeof value === "string" ? value : text}
          dir={ctx.dir}
          onChange={(html) => onChange(path, typeof value === "string" ? html : html ? [html] : [])}
        />
        <Reference value={reference} ctx={ctx} />
      </div>
    );
  }

  if (typeof value === "string") {
    const kind = mediaKind(name);
    if (kind) {
      return (
        <div data-path={pathKey(path)}>
          <MediaField
            label={label}
            name={name}
            kind={kind}
            value={value}
            onChange={(v) => onChange(path, v)}
          />
        </div>
      );
    }
    const long = LONG_KEYS.has(name) || value.length > 90;
    return (
      <label className="flex flex-col gap-1" data-path={pathKey(path)}>
        <span className={small}>
          {label} <Key name={name} />
        </span>
        {long ? (
          <textarea
            dir={ctx.dir}
            rows={Math.min(10, Math.max(3, Math.ceil(value.length / 70)))}
            className={input}
            value={value}
            onChange={(e) => onChange(path, e.target.value)}
          />
        ) : (
          <input dir={ctx.dir} className={input} value={value} onChange={(e) => onChange(path, e.target.value)} />
        )}
        <Reference value={reference} ctx={ctx} />
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <label className="flex flex-col gap-1" data-path={pathKey(path)}>
        <span className={small}>
          {label} <Key name={name} />
        </span>
        <input type="number" className={input} value={value} onChange={(e) => onChange(path, Number(e.target.value))} />
      </label>
    );
  }
  if (typeof value === "boolean") {
    return (
      <label className="flex cursor-pointer items-center gap-3 py-1" data-path={pathKey(path)}>
        <input type="checkbox" className="h-4 w-4 accent-navy" checked={value} onChange={(e) => onChange(path, e.target.checked)} />
        <span className="text-[15px] text-navy">{label}</span>
        <span className={small}>
          <Key name={name} />
        </span>
      </label>
    );
  }
  if (value === null) return null;

  if (Array.isArray(value)) {
    return (
      <ListField name={name} label={label} value={value} reference={reference} path={path} onChange={onChange} ctx={ctx} depth={depth} />
    );
  }

  return (
    <Group label={label} name={name} depth={depth} forced={Boolean(ctx.focus && startsWith(ctx.focus, path))}>
      {Object.entries(value).map(([k, v]) => (
        <Field
          key={k}
          name={k}
          value={v}
          reference={child(reference, k)}
          path={[...path, k]}
          onChange={onChange}
          ctx={ctx}
          depth={depth + 1}
        />
      ))}
    </Group>
  );
}

function Group({
  label,
  name,
  depth,
  forced,
  children,
}: {
  label: string;
  name: string;
  depth: number;
  forced: boolean;
  children: React.ReactNode;
}) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = forced || (userOpen ?? depth < 2);
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 border border-border-soft bg-surface/40 p-3">
      <button type="button" onClick={() => setUserOpen(!open)} className="flex w-full cursor-pointer items-center justify-between text-start">
        <span className="text-[14px] font-bold text-navy">
          {label} <Key name={name} />
        </span>
        <span className="text-muted">{open ? "−" : "+"}</span>
      </button>
      {open ? children : null}
    </fieldset>
  );
}

function ListField({
  name,
  label,
  value,
  reference,
  path,
  onChange,
  ctx,
  depth,
}: {
  name: string;
  label: string;
  value: Json[];
  reference?: Json;
  path: Path;
  onChange: (path: Path, value: Json) => void;
  ctx: EditorContext;
  depth: number;
}) {
  const strings = value.every((v) => typeof v === "string");
  const move = (i: number, d: 1 | -1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const copy = value.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(path, copy);
  };
  const remove = (i: number) => {
    if (window.confirm(`حذف العنصر ${i + 1} من «${label}»؟ يمكنك التراجع عن ذلك.`)) onChange(path, value.filter((_, k) => k !== i));
  };
  const duplicate = (i: number) => onChange(path, [...value.slice(0, i + 1), structuredClone(value[i]), ...value.slice(i + 1)]);
  /* The shape of an item, remembered so a list emptied of every item can still grow again. */
  const [template] = useState<Json>(() => (value.length ? blank(value[0]) : ""));
  const add = () => onChange(path, [...value, value.length ? blank(value[value.length - 1]) : template]);

  return (
    <fieldset className="flex min-w-0 flex-col gap-2 border border-border-soft p-3" data-path={pathKey(path)}>
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-bold text-navy">
          {label} <Key name={`${name} · ${value.length}`} />
        </span>
        <button type="button" className={btn} onClick={add}>
          + إضافة
        </button>
      </div>
      {value.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 border border-border-soft bg-white p-2" data-path={pathKey([...path, i])}>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] text-muted">
              {i + 1}. {strings ? "" : summarize(item)}
            </span>
            <span className="flex shrink-0 gap-1">
              <button type="button" className={btn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="أعلى" title="أعلى">
                ↑
              </button>
              <button type="button" className={btn} onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="أسفل" title="أسفل">
                ↓
              </button>
              <button type="button" className={btn} onClick={() => duplicate(i)} title="نسخ العنصر">
                نسخ
              </button>
              <button type="button" className={`${btn} text-danger`} onClick={() => remove(i)}>
                حذف
              </button>
            </span>
          </div>
          {strings ? (
            <>
              <input
                dir={ctx.dir}
                className={input}
                data-path={pathKey([...path, i])}
                value={item as string}
                onChange={(e) => onChange([...path, i], e.target.value)}
              />
              <Reference value={child(reference, i)} ctx={ctx} />
            </>
          ) : typeof item === "object" && item !== null && !Array.isArray(item) ? (
            <div className="flex flex-col gap-3">
              {withSiblingFields(item, value).map(([k, v]) => (
                <Field
                  key={k}
                  name={k}
                  value={v}
                  reference={child(child(reference, i), k)}
                  path={[...path, i, k]}
                  onChange={onChange}
                  ctx={ctx}
                  depth={depth + 1}
                />
              ))}
            </div>
          ) : (
            <Field name="value" value={item} path={[...path, i]} onChange={onChange} ctx={ctx} depth={depth + 1} />
          )}
        </div>
      ))}
    </fieldset>
  );
}

const ext = (url: string) => (url.split(".").pop() ?? "").toUpperCase().slice(0, 4);

const ACCEPT: Record<MediaKind, string> = {
  image: "image/*",
  video: "video/mp4,video/webm",
  document: ".pdf,.docx,.xlsx,.pptx,application/pdf",
};

/**
 * A picture, video or document field, as in Strapi's media fields: a
 * preview you can drop a file on, a button to upload one directly, and one
 * to pick from the media library.
 */
export function MediaField({
  label,
  name,
  kind,
  value,
  onChange,
}: {
  label: string;
  name: string;
  kind: MediaKind;
  value: string;
  onChange: (v: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const choose = { image: "من المكتبة", video: "من المكتبة", document: "من المكتبة" }[kind];
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      onChange((await uploadFile(file, setProgress)).url);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setProgress(null);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <span className={small}>
        {label} <Key name={name} />
      </span>
      <div className="flex items-start gap-3">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void upload(e.dataTransfer.files[0]);
          }}
          title="اسحب ملفًا وأفلته هنا للرفع"
          className={`relative flex h-24 w-36 shrink-0 cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed bg-surface ${
            over ? "border-gold bg-gold/10" : "border-border-soft"
          }`}
        >
          {value && kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : value && kind === "video" ? (
            <video src={`${value}#t=0.1`} muted preload="metadata" className="h-full w-full object-cover" />
          ) : value ? (
            <span className="text-[14px] font-bold text-navy">{ext(value)}</span>
          ) : (
            <span className="px-2 text-center text-[12px] leading-5 text-muted">اسحب ملفًا هنا أو انقر للرفع</span>
          )}
          {progress !== null ? (
            <span className="absolute inset-x-0 bottom-0 h-1.5 bg-white/70">
              <span className="block h-full bg-gold" style={{ width: `${Math.round(progress * 100)}%` }} />
            </span>
          ) : null}
          <input type="file" accept={ACCEPT[kind]} className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
        </label>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input dir="ltr" className={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder="/media/…" />
          <div className="flex flex-wrap gap-2">
            <label className={btn}>
              {progress !== null ? `جارٍ الرفع ${Math.round(progress * 100)}%` : "رفع ملف"}
              <input type="file" accept={ACCEPT[kind]} className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
            </label>
            <button type="button" className={btn} onClick={() => setPicking(true)}>
              {choose}
            </button>
            {value ? (
              <button type="button" className={`${btn} text-danger`} onClick={() => onChange("")}>
                إزالة
              </button>
            ) : null}
          </div>
          {error ? <span className="text-[12px] text-danger">{error}</span> : null}
          {kind === "image" ? <span className="text-[12px] leading-5 text-muted">{IMAGE_HINT}</span> : null}
        </div>
      </div>
      {picking ? (
        <MediaPicker
          kind={kind}
          current={value}
          onPick={(item: MediaItem) => {
            onChange(item.url);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      ) : null}
    </div>
  );
}

/**
 * A list of pictures (a story's or a block's gallery): thumbnails in order,
 * each movable and removable, and as many new pictures as wanted at once,
 * dropped on the field or chosen together in the file dialog. Pictures that
 * break the limits (./images) are skipped with a note; the rest still go up.
 */
export function MultiImageField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const images = value.filter(Boolean);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);

  const upload = async (files: FileList | File[] | null | undefined) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setErrors([]);
    const added: string[] = [];
    const failed: string[] = [];
    for (const [i, file] of list.entries()) {
      setBusy({ done: i, total: list.length });
      try {
        added.push((await uploadFile(file)).url);
      } catch (e) {
        failed.push(`${file.name}: ${errorText(e)}`);
      }
    }
    setBusy(null);
    setErrors(failed);
    if (added.length) onChange([...images, ...added]);
  };
  const move = (i: number, d: 1 | -1) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const copy = images.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className={small}>
        {label} <Key name={`${name} · ${images.length}`} />
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void upload(e.dataTransfer.files);
        }}
        className={`flex flex-col gap-3 border-2 border-dashed p-3 ${over ? "border-gold bg-gold/10" : "border-border-soft bg-surface/40"}`}
      >
        {images.length ? (
          <ul className="grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 md:grid-cols-4">
            {images.map((src, i) => (
              <li key={`${src}-${i}`} className="flex flex-col gap-1 border border-border-soft bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="aspect-[4/3] w-full bg-surface object-cover" />
                <span className="flex items-center justify-between gap-1">
                  <span className="text-[12px] text-muted">{i + 1}</span>
                  <span className="flex gap-1">
                    <button type="button" className={btn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="قبل" title="قبل">
                      ↑
                    </button>
                    <button type="button" className={btn} disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label="بعد" title="بعد">
                      ↓
                    </button>
                    <button type="button" className={`${btn} text-danger`} onClick={() => onChange(images.filter((_, k) => k !== i))}>
                      حذف
                    </button>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">لا توجد صور بعد. اسحب الصور وأفلتها هنا أو اخترها دفعة واحدة.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <label className={btn}>
            {busy ? `جارٍ رفع ${busy.done + 1} من ${busy.total}…` : "+ رفع صور (عدة صور معًا)"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={Boolean(busy)}
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" className={btn} onClick={() => setPicking(true)}>
            إضافة من المكتبة
          </button>
        </div>
        <span className="text-[12px] leading-5 text-muted">{IMAGE_HINT}</span>
        {errors.map((e) => (
          <span key={e} className="text-[12px] text-danger">
            {e}
          </span>
        ))}
      </div>
      {picking ? (
        <MediaPicker
          kind="image"
          current=""
          onPick={(item: MediaItem) => {
            onChange([...images, item.url]);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      ) : null}
    </div>
  );
}
