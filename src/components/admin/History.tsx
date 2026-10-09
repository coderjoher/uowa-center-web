"use client";

import { useEffect, useState } from "react";
import { api, formatDate, type DocKey, type Json } from "./api";
import { SECTION_LABELS } from "./labels";
import { btn, card, h1, small } from "./ui";

interface Revision {
  id: number;
  version: number;
  note: string;
  createdAt: string;
  author: string | null;
}

export const DOC_LABELS: Record<DocKey, string> = {
  ar: "المحتوى العربي",
  en: "المحتوى الإنجليزي",
  settings: "إظهار الأقسام",
};

/** Top-level sections whose content differs between two documents. */
function changedSections(a: Json, b: Json): string[] {
  const x = (a ?? {}) as { [k: string]: Json };
  const y = (b ?? {}) as { [k: string]: Json };
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  return [...keys].filter((k) => JSON.stringify(x[k]) !== JSON.stringify(y[k])).map((k) => SECTION_LABELS[k] ?? k);
}

/**
 * Every save of a document, newest first. Picking one shows which sections
 * differ from the current content; restoring it saves it as a new version,
 * so a restore can itself be undone.
 */
export function History({
  current,
  dirty,
  onRestore,
  onError,
}: {
  current: Partial<Record<DocKey, { saved: Json; version: number }>>;
  dirty: (key: DocKey) => boolean;
  onRestore: (key: DocKey, revisionId: number) => Promise<void>;
  onError: (e: unknown) => void;
}) {
  const [key, setKey] = useState<DocKey>("ar");
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [picked, setPicked] = useState<{ id: number; diff: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const version = current[key]?.version;

  useEffect(() => {
    let live = true;
    api<{ revisions: Revision[] }>(`/api/admin/revisions?key=${key}`)
      .then((r) => live && setRevisions(r.revisions))
      .catch((e) => live && onError(e));
    return () => {
      live = false;
    };
  }, [key, version, onError]);

  const pick = async (id: number) => {
    try {
      const rev = await api<{ data: Json }>(`/api/admin/revisions?id=${id}`);
      setPicked({ id, diff: changedSections(rev.data, current[key]?.saved ?? null) });
    } catch (e) {
      onError(e);
    }
  };

  const restore = async (rev: Revision) => {
    const warn = dirty(key) ? "\nستُفقد التعديلات غير المحفوظة في هذا المحتوى." : "";
    if (!window.confirm(`استعادة النسخة ${rev.version} (${formatDate(rev.createdAt)})؟${warn}`)) return;
    setBusy(true);
    try {
      await onRestore(key, rev.id);
      setPicked(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-4">
      <h1 className={h1}>سجل التعديلات</h1>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DOC_LABELS) as DocKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKey(k);
              setRevisions(null);
              setPicked(null);
            }}
            className={`${btn} ${key === k ? "border-navy font-bold" : ""}`}
          >
            {DOC_LABELS[k]}
          </button>
        ))}
      </div>
      {revisions === null ? <p className={small}>جارٍ التحميل…</p> : null}
      <ol className="flex flex-col gap-2">
        {revisions?.map((rev) => {
          const isCurrent = rev.version === version;
          return (
            <li key={rev.id} className={`${card} flex flex-col gap-2`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-navy">
                    النسخة {rev.version}
                    {isCurrent ? <span className="ms-2 bg-gold px-1.5 text-[11px] text-navy">الحالية</span> : null}
                  </span>
                  <span className={small}>
                    {formatDate(rev.createdAt)} · {rev.author ?? "—"}
                    {rev.note ? ` · ${rev.note}` : ""}
                  </span>
                </div>
                {isCurrent ? null : (
                  <span className="flex gap-2">
                    <button type="button" className={btn} onClick={() => void pick(rev.id)}>
                      ما الذي يختلف؟
                    </button>
                    <button type="button" className={btn} disabled={busy} onClick={() => void restore(rev)}>
                      استعادة
                    </button>
                  </span>
                )}
              </div>
              {picked?.id === rev.id ? (
                <p className="text-[13px] text-navy">
                  {picked.diff.length ? `تختلف عن الحالية في: ${picked.diff.join("، ")}` : "مطابقة للمحتوى الحالي."}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
