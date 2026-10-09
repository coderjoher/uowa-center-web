"use client";

import { useState } from "react";
import type { Json, MediaItem } from "./api";
import { IMAGE_KEYS, LONG_KEYS, VIDEO_KEYS, labelFor } from "./labels";
import { MediaPicker } from "./MediaLibrary";
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

/** The value at `key` of an object or list, if `value` is one. */
function child(value: Json | undefined, key: string | number): Json | undefined {
  if (value && typeof value === "object") return (value as { [k: string]: Json })[key as string];
  return undefined;
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
  for (const k of ["title", "name", "label", "question", "year", "caption", "heading", "date", "activity"]) {
    const v = value[k];
    if (typeof v === "string" && v) return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v.join(" ");
  }
  return "";
}

export interface EditorContext {
  /** Text direction of the language being edited. */
  dir: "rtl" | "ltr";
  /** Label of the other language, when its text is shown as a reference. */
  referenceLabel?: string;
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
  if (typeof value !== "string" || !value || !ctx.referenceLabel) return null;
  return (
    <span className="text-[12px] leading-5 text-muted" dir="auto">
      <span className="font-bold">{ctx.referenceLabel}:</span> {value}
    </span>
  );
}

/**
 * Renders any JSON value as a form, by shape: strings become inputs (or a
 * textarea for paragraph keys, or the media picker for picture and video
 * keys), numbers and booleans their controls, arrays lists with
 * add/remove/reorder, objects collapsible groups. Every edit reports the
 * full path so the document is updated immutably at the root.
 */
export function Field({ name, value, reference, path, onChange, ctx, depth = 0 }: FieldProps) {
  const label = labelFor(name);

  if (typeof value === "string") {
    if (IMAGE_KEYS.has(name) || VIDEO_KEYS.has(name)) {
      return (
        <MediaField
          label={label}
          name={name}
          kind={VIDEO_KEYS.has(name) ? "video" : "image"}
          value={value}
          onChange={(v) => onChange(path, v)}
        />
      );
    }
    const long = LONG_KEYS.has(name) || value.length > 90;
    return (
      <label className="flex flex-col gap-1">
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
    return (
      <ListField name={name} label={label} value={value} reference={reference} path={path} onChange={onChange} ctx={ctx} depth={depth} />
    );
  }

  return (
    <Group label={label} name={name} depth={depth}>
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

function Group({ label, name, depth, children }: { label: string; name: string; depth: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(depth < 2);
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 border border-border-soft bg-surface/40 p-3">
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
    if (window.confirm(`حذف العنصر ${i + 1} من «${label}»؟`)) onChange(path, value.filter((_, k) => k !== i));
  };
  const add = () => onChange(path, [...value, value.length ? blank(value[value.length - 1]) : ""]);

  return (
    <fieldset className="flex min-w-0 flex-col gap-2 border border-border-soft p-3">
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
            <>
              <input dir={ctx.dir} className={input} value={item as string} onChange={(e) => onChange([...path, i], e.target.value)} />
              <Reference value={child(reference, i)} ctx={ctx} />
            </>
          ) : typeof item === "object" && item !== null && !Array.isArray(item) ? (
            <div className="flex flex-col gap-3">
              {Object.entries(item).map(([k, v]) => (
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

function MediaField({
  label,
  name,
  kind,
  value,
  onChange,
}: {
  label: string;
  name: string;
  kind: "image" | "video";
  value: string;
  onChange: (v: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <span className={small}>
        {label} <Key name={name} />
      </span>
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden border border-border-soft bg-surface">
          {value && kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : value ? (
            <video src={`${value}#t=0.1`} muted preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[12px] text-muted">لا يوجد</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input dir="ltr" className={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder="/media/…" />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => setPicking(true)}>
              {kind === "video" ? "اختيار فيديو أو رفعه…" : "اختيار صورة أو رفعها…"}
            </button>
            {value ? (
              <button type="button" className={`${btn} text-danger`} onClick={() => onChange("")}>
                إزالة
              </button>
            ) : null}
          </div>
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
