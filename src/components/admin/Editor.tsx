"use client";

import { useState } from "react";
import { IMAGE_KEYS, LONG_KEYS, labelFor } from "./labels";

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type Path = (string | number)[];

export interface EditorContext {
  /** Uploads a picture and resolves to its public path (`/images/...`). */
  upload: (file: File) => Promise<string>;
  /** Public paths of pictures already in the repository, for the picker. */
  images: string[];
}

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

/** A blank copy of a value: strings emptied, numbers zeroed, arrays kept to one blank item. */
function blank(value: Json): Json {
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (value === null) return null;
  if (Array.isArray(value)) return value.length ? [blank(value[0])] : [];
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blank(v)]));
}

/** A short description of an object in a list, for its card header. */
function summarize(value: Json): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return String(value ?? "");
  for (const k of ["title", "name", "label", "question", "year", "caption", "heading", "date"]) {
    const v = value[k];
    if (typeof v === "string" && v) return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v.join(" ");
  }
  return "";
}

const input =
  "w-full border border-border-soft bg-white px-3 py-2 text-[15px] leading-6 text-navy outline-none focus:border-navy";
const small = "text-[12px] leading-5 text-muted";
const btn =
  "inline-flex h-8 cursor-pointer items-center gap-1 border border-border-soft bg-white px-2.5 text-[13px] text-navy hover:border-navy disabled:cursor-default disabled:opacity-40";

function Key({ name }: { name: string }) {
  return (
    <span dir="ltr" className="font-normal opacity-60">
      ({name})
    </span>
  );
}

/**
 * Renders any JSON value as a form, by shape: strings become inputs (or a
 * textarea for paragraph keys, or an image picker for picture keys),
 * numbers and booleans their controls, arrays lists with add/remove/reorder,
 * objects collapsible groups. Every edit reports the full path so the
 * document is updated immutably at the root.
 */
export function Field({
  name,
  value,
  path,
  onChange,
  ctx,
  depth = 0,
}: {
  name: string;
  value: Json;
  path: Path;
  onChange: (path: Path, value: Json) => void;
  ctx: EditorContext;
  depth?: number;
}) {
  const label = labelFor(name);

  if (typeof value === "string") {
    if (IMAGE_KEYS.has(name)) {
      return <ImageField label={label} value={value} onChange={(v) => onChange(path, v)} ctx={ctx} />;
    }
    const long = LONG_KEYS.has(name) || value.length > 90;
    return (
      <label className="flex flex-col gap-1">
        <span className={small}>
          {label} <Key name={name} />
        </span>
        {long ? (
          <textarea
            rows={Math.min(8, Math.max(3, Math.ceil(value.length / 70)))}
            className={input}
            value={value}
            onChange={(e) => onChange(path, e.target.value)}
          />
        ) : (
          <input className={input} value={value} onChange={(e) => onChange(path, e.target.value)} />
        )}
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <label className="flex flex-col gap-1">
        <span className={small}>
          {label} <Key name={name} />
        </span>
        <input type="number" className={input} value={value} onChange={(e) => onChange(path, Number(e.target.value))} />
      </label>
    );
  }
  if (typeof value === "boolean") {
    return (
      <label className="flex cursor-pointer items-center gap-3 py-1">
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
    return <ListField name={name} label={label} value={value} path={path} onChange={onChange} ctx={ctx} depth={depth} />;
  }

  return (
    <Group label={label} name={name} depth={depth}>
      {Object.entries(value).map(([k, v]) => (
        <Field key={k} name={k} value={v} path={[...path, k]} onChange={onChange} ctx={ctx} depth={depth + 1} />
      ))}
    </Group>
  );
}

function Group({ label, name, depth, children }: { label: string; name: string; depth: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(depth < 2);
  return (
    <fieldset className="flex flex-col gap-3 border border-border-soft bg-surface/40 p-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full cursor-pointer items-center justify-between text-start">
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
  path,
  onChange,
  ctx,
  depth,
}: {
  name: string;
  label: string;
  value: Json[];
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
  const remove = (i: number) => onChange(path, value.filter((_, k) => k !== i));
  const add = () => onChange(path, [...value, value.length ? blank(value[value.length - 1]) : ""]);

  return (
    <fieldset className="flex flex-col gap-2 border border-border-soft p-3">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-bold text-navy">
          {label} <Key name={`${name} · ${value.length}`} />
        </span>
        <button type="button" className={btn} onClick={add}>
          + إضافة
        </button>
      </div>
      {value.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 border border-border-soft bg-white p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] text-muted">
              {i + 1}. {strings ? "" : summarize(item)}
            </span>
            <span className="flex shrink-0 gap-1">
              <button type="button" className={btn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="أعلى">
                ↑
              </button>
              <button type="button" className={btn} onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="أسفل">
                ↓
              </button>
              <button type="button" className={`${btn} text-danger`} onClick={() => remove(i)}>
                حذف
              </button>
            </span>
          </div>
          {strings ? (
            <input className={input} value={item as string} onChange={(e) => onChange([...path, i], e.target.value)} />
          ) : (
            <ItemFields item={item} path={[...path, i]} onChange={onChange} ctx={ctx} depth={depth + 1} />
          )}
        </div>
      ))}
    </fieldset>
  );
}

function ItemFields({
  item,
  path,
  onChange,
  ctx,
  depth,
}: {
  item: Json;
  path: Path;
  onChange: (path: Path, value: Json) => void;
  ctx: EditorContext;
  depth: number;
}) {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return <Field name="value" value={item} path={path} onChange={onChange} ctx={ctx} depth={depth} />;
  }
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(item).map(([k, v]) => (
        <Field key={k} name={k} value={v} path={[...path, k]} onChange={onChange} ctx={ctx} depth={depth} />
      ))}
    </div>
  );
}

function ImageField({ label, value, onChange, ctx }: { label: string; value: string; onChange: (v: string) => void; ctx: EditorContext }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <span className={small}>{label}</span>
      <div className="flex items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden border border-border-soft bg-surface">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input dir="ltr" className={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder="/images/…" />
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${btn} max-w-[240px]`} value="" onChange={(e) => e.target.value && onChange(e.target.value)}>
              <option value="">اختيار صورة موجودة…</option>
              {ctx.images.map((p) => (
                <option key={p} value={p}>
                  {p.replace("/images/", "")}
                </option>
              ))}
            </select>
            <label className={btn}>
              {busy ? "جارٍ الرفع…" : "رفع صورة جديدة"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  setError(null);
                  try {
                    onChange(await ctx.upload(file));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : String(err));
                  } finally {
                    setBusy(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
          {error ? <p className="text-[13px] text-danger">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
