"use client";

import type { AdminUi } from "@/components/admin/resumeEditorShared";
import { moveItem } from "@/components/admin/resumeEditorShared";

type Props = {
    label: string;
    bullets: string[];
    onChange: (bullets: string[]) => void;
    ui: AdminUi;
};

/** Reusable string-array editor: one textarea per bullet with reorder,
 * remove, and add controls. */
export default function BulletListEditor({ label, bullets, onChange, ui }: Props) {
    return (
        <div>
            <label className={ui.labelClass}>{label}</label>
            <div className="grid gap-2">
                {bullets.map((bullet, index) => (
                    <div key={index} className="flex items-start gap-2">
                        <textarea aria-label={`${label} ${index + 1}`}
                            className={`${ui.textareaClass} min-h-[48px] flex-1`}
                            value={bullet}
                            onChange={(e) => {
                                const next = [...bullets];
                                next[index] = e.target.value;
                                onChange(next);
                            }}
                        />
                        <div className="flex shrink-0 flex-col gap-1">
                            <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => onChange(moveItem(bullets, index, -1))}
                                className={ui.btnAdd}
                                aria-label="Move bullet up"
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                disabled={index === bullets.length - 1}
                                onClick={() => onChange(moveItem(bullets, index, 1))}
                                className={ui.btnAdd}
                                aria-label="Move bullet down"
                            >
                                ↓
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange(bullets.filter((_, i) => i !== index))}
                                className={ui.btnDanger}
                                aria-label="Remove bullet"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
                <div>
                    <button type="button" onClick={() => onChange([...bullets, ""])} className={ui.btnAdd}>
                        + Add bullet
                    </button>
                </div>
            </div>
        </div>
    );
}
