"use client";

import { useCallback } from "react";
import type { NavStyleConfig } from "@/lib/frontPageDefaults";
import { AVAILABLE_FONTS } from "@/lib/fonts";

type Props = {
    value: NavStyleConfig;
    onChange: (patch: Partial<NavStyleConfig>) => void;
};

const inputClass =
    "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2 text-sm outline-none focus:border-chestnut dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:focus:border-caramel";
const labelClass = "block text-sm font-semibold text-chestnut-dark dark:text-dark-text mb-1";

function ColorField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value || placeholder || "#480903"}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-desert-tan-dark"
                />
                <input
                    className={inputClass}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || "theme default"}
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="shrink-0 text-xs text-olive hover:text-copper dark:text-dark-muted dark:hover:text-caramel"
                        title="Reset to default"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}

export default function NavStyleEditor({ value, onChange }: Props) {
    return (
        <div className="mt-6 rounded-xl border border-desert-tan-dark/50 bg-white/40 p-5 dark:border-dark-muted/50 dark:bg-dark-bg/40">
            <h3 className="mb-2 text-base font-semibold text-chestnut dark:text-dark-text">Navigation Styles</h3>
            <p className="mb-4 text-sm text-olive-dark dark:text-dark-muted">
                Customize the appearance of the top navigation bar. Leave blank to use theme defaults.
            </p>

            <div className="mb-4">
                <label className={labelClass}>Navigation Font</label>
                <select
                    className={inputClass}
                    value={value.font}
                    onChange={(e) => onChange({ font: e.target.value })}
                >
                    <option value="">Theme default (inherited)</option>
                    {AVAILABLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <ColorField label="Background Color" value={value.bgColor} onChange={(v) => onChange({ bgColor: v })} placeholder="#d4be8a" />
                <ColorField label="Background Color (dark)" value={value.bgColorDark} onChange={(v) => onChange({ bgColorDark: v })} placeholder="#252525" />
                <ColorField label="Text Color" value={value.textColor} onChange={(v) => onChange({ textColor: v })} placeholder="#f5ead5" />
                <ColorField label="Text Color (dark)" value={value.textColorDark} onChange={(v) => onChange({ textColorDark: v })} placeholder="#b8a86c" />
                <ColorField label="Accent Color" value={value.accentColor} onChange={(v) => onChange({ accentColor: v })} placeholder="#e8a060" />
                <ColorField label="Accent Color (dark)" value={value.accentColorDark} onChange={(v) => onChange({ accentColorDark: v })} placeholder="#e8a060" />
            </div>
        </div>
    );
}
