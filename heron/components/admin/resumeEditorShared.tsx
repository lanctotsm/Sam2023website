import type { Dispatch, SetStateAction } from "react";
import type { ResumeDocument } from "@/lib/resume/types";

export type AdminUi = {
    labelClass: string;
    inputClass: string;
    textareaClass: string;
    btnAdd: string;
    btnDanger: string;
};

export type SectionEditorProps = {
    doc: ResumeDocument;
    setDoc: Dispatch<SetStateAction<ResumeDocument>>;
    ui: AdminUi;
};

export function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
    const target = index + direction;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

export function generateEntryId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function TextField({
    label,
    value,
    onChange,
    ui,
    placeholder,
    hint
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    ui: AdminUi;
    placeholder?: string;
    hint?: string;
}) {
    return (
        <div>
            <label className={ui.labelClass}>{label}</label>
            <input
                className={ui.inputClass}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && <p className="mb-0 mt-1 text-xs text-olive dark:text-dark-muted">{hint}</p>}
        </div>
    );
}

export function TextAreaField({
    label,
    value,
    onChange,
    ui,
    hint
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    ui: AdminUi;
    hint?: string;
}) {
    return (
        <div>
            <label className={ui.labelClass}>{label}</label>
            <textarea
                className={ui.textareaClass}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && <p className="mb-0 mt-1 text-xs text-olive dark:text-dark-muted">{hint}</p>}
        </div>
    );
}

export function EntryControls({
    index,
    count,
    onMove,
    onRemove,
    ui
}: {
    index: number;
    count: number;
    onMove: (direction: -1 | 1) => void;
    onRemove: () => void;
    ui: AdminUi;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                disabled={index === 0}
                onClick={() => onMove(-1)}
                className={ui.btnAdd}
                aria-label="Move up"
            >
                ↑
            </button>
            <button
                type="button"
                disabled={index === count - 1}
                onClick={() => onMove(1)}
                className={ui.btnAdd}
                aria-label="Move down"
            >
                ↓
            </button>
            <button type="button" onClick={onRemove} className={ui.btnDanger}>
                Remove
            </button>
        </div>
    );
}

export const entryCardClass =
    "rounded-lg border border-desert-tan-dark/50 bg-white/60 p-4 dark:border-dark-muted/50 dark:bg-dark-bg/40";
