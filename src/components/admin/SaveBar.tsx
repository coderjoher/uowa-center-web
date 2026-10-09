"use client";

import { DOC_LABELS } from "./History";
import { useCms } from "./store";
import { btn, primary, secondary } from "./ui";

/** Undo, redo, discard and "save and publish", for every document with changes. */
export function SaveControls({ compact = false }: { compact?: boolean }) {
  const { undo, redo, canUndo, canRedo, dirtyKeys, discardAll, saveAll, busy } = useCms();
  const dirty = dirtyKeys.length > 0;
  return (
    <div className="flex items-center gap-2">
      {compact ? null : (
        <span className={`hidden text-[12px] lg:inline ${dirty ? "text-navy" : "text-muted"}`}>
          {dirty ? `غير منشور: ${dirtyKeys.map((k) => DOC_LABELS[k]).join("، ")}` : "كل التعديلات منشورة"}
        </span>
      )}
      <button type="button" className={btn} onClick={undo} disabled={!canUndo} title="تراجع (Ctrl+Z)">
        ↶
      </button>
      <button type="button" className={btn} onClick={redo} disabled={!canRedo} title="إعادة (Ctrl+Shift+Z)">
        ↷
      </button>
      <button type="button" className={`${secondary} h-9`} onClick={discardAll} disabled={!dirty || !!busy}>
        تجاهل
      </button>
      <button type="button" className={`${primary} h-9`} onClick={() => void saveAll()} disabled={!dirty || !!busy} title="حفظ ونشر (Ctrl+S)">
        {busy ?? "حفظ ونشر"}
      </button>
    </div>
  );
}
