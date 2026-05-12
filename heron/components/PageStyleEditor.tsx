"use client";

import { useCallback } from "react";
import LucideIcon from "@/components/LucideIcon";
import type { PageBackgroundConfig, PageStyleConfig, PageStyleEntry } from "@/lib/frontPageDefaults";
import { AVAILABLE_FONTS } from "@/lib/fonts";

type Props = {
    label: string;
    value: PageStyleEntry;
    onChange: (patch: PageStyleEntry) => void;
    onUpload: (file: File) => Promise<string>;
    showToast: (message: string, type: "success" | "error") => void;
};

const inputClass =
    "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2 text-sm outline-none focus:border-chestnut dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:focus:border-caramel";
const labelClass = "block text-sm font-semibold text-chestnut-dark dark:text-dark-text mb-1";
const btnAdd =
    "rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-sm font-medium text-chestnut transition-colors hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface";
const groupClass =
    "rounded-lg border border-desert-tan-dark/30 bg-white/20 p-4 dark:border-dark-muted/30 dark:bg-dark-bg/20";
const groupTitleClass = "mb-3 text-sm font-bold uppercase tracking-wider text-olive-dark dark:text-dark-muted";

function ColorField({ label: lbl, value: val, onChange: onCh, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className={labelClass}>{lbl}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={val || placeholder || "#480903"}
                    onChange={(e) => onCh(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-desert-tan-dark"
                />
                <input
                    className={inputClass}
                    value={val}
                    onChange={(e) => onCh(e.target.value)}
                    placeholder={placeholder || "theme default"}
                />
                {val && (
                    <button
                        type="button"
                        onClick={() => onCh("")}
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

export default function PageStyleEditor({ label, value, onChange, onUpload, showToast }: Props) {
    const bg = value.background;
    const style = value.style;

    const updateBg = useCallback(
        (patch: Partial<PageBackgroundConfig>) =>
            onChange({ ...value, background: { ...bg, ...patch } }),
        [value, bg, onChange]
    );
    const updateStyle = useCallback(
        (patch: Partial<PageStyleConfig>) =>
            onChange({ ...value, style: { ...style, ...patch } }),
        [value, style, onChange]
    );

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        showToast("Uploading image...", "success");
        try {
            const url = await onUpload(file);
            updateBg({ backgroundImage: url, backgroundType: "image" });
            showToast("Image uploaded!", "success");
        } catch {
            showToast("Upload failed", "error");
        }
    };

    const inputId = `bg-upload-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
        <div className="rounded-xl border border-desert-tan-dark/50 bg-white/40 p-5 dark:border-dark-muted/50 dark:bg-dark-bg/40">
            <h3 className="mb-5 text-base font-semibold text-chestnut dark:text-dark-text">{label}</h3>

            {/* ── Background ── */}
            <div className={groupClass + " mb-4"}>
                <p className={groupTitleClass}>Background</p>
                <div className="mb-3">
                    <label className={labelClass}>Background Type</label>
                    <select
                        className={inputClass}
                        value={bg.backgroundType}
                        onChange={(e) =>
                            updateBg({ backgroundType: e.target.value as PageBackgroundConfig["backgroundType"] })
                        }
                    >
                        <option value="none">None (theme default)</option>
                        <option value="gradient">Gradient</option>
                        <option value="color">Solid color</option>
                        <option value="image">Image</option>
                    </select>
                </div>

                {bg.backgroundType === "color" && (
                    <ColorField label="Background Color" value={bg.backgroundColor} onChange={(v) => updateBg({ backgroundColor: v })} placeholder="#6B2D2D" />
                )}

                {bg.backgroundType === "gradient" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <ColorField label="Gradient From" value={bg.gradientFrom} onChange={(v) => updateBg({ gradientFrom: v })} placeholder="#6B2D2D" />
                        <ColorField label="Gradient To" value={bg.gradientTo} onChange={(v) => updateBg({ gradientTo: v })} placeholder="#8B4D4D" />
                    </div>
                )}

                {bg.backgroundType === "image" && (
                    <div className="space-y-3">
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-desert-tan-dark bg-white/50 p-5 text-center transition-colors hover:bg-white dark:border-dark-muted dark:bg-dark-bg/50 dark:hover:bg-dark-surface">
                            <LucideIcon name="Upload" size={22} className="mb-2 text-olive dark:text-dark-muted" />
                            <p className="mb-2 text-sm text-chestnut-dark dark:text-dark-muted">Drop an image or click to select</p>
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" id={inputId} onChange={handleFileChange} />
                            <button type="button" onClick={() => document.getElementById(inputId)?.click()} className={btnAdd}>Select Image</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="shrink-0 text-sm font-medium text-chestnut-dark dark:text-dark-text">URL:</span>
                            <input className={inputClass} value={bg.backgroundImage} onChange={(e) => updateBg({ backgroundImage: e.target.value })} placeholder="https://…" />
                        </div>
                        {bg.backgroundImage && (
                            <div className="text-sm text-olive-dark dark:text-dark-muted">
                                <p>Preview:</p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={bg.backgroundImage} alt="Background preview" className="mt-2 max-h-40 w-full rounded-lg border border-desert-tan-dark object-cover dark:border-dark-muted" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }} />
                            </div>
                        )}
                    </div>
                )}

                {(bg.backgroundType === "color" || bg.backgroundType === "gradient") && (
                    <div className="mt-3 h-10 w-full rounded-lg border border-desert-tan-dark dark:border-dark-muted"
                        style={
                            bg.backgroundType === "color"
                                ? { backgroundColor: bg.backgroundColor }
                                : bg.gradientFrom && bg.gradientTo
                                    ? { background: `linear-gradient(to right, ${bg.gradientFrom}, ${bg.gradientTo})` }
                                    : {}
                        }
                    />
                )}
            </div>

            {/* ── Typography ── */}
            <div className={groupClass + " mb-4"}>
                <p className={groupTitleClass}>Typography</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Heading Font (H1, H2, H3)</label>
                        <select className={inputClass} value={style.headingFont} onChange={(e) => updateStyle({ headingFont: e.target.value })}>
                            <option value="">Theme default (Roboto)</option>
                            {AVAILABLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Body Font (paragraphs)</label>
                        <select className={inputClass} value={style.bodyFont} onChange={(e) => updateStyle({ bodyFont: e.target.value })}>
                            <option value="">Theme default (Inter)</option>
                            {AVAILABLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>

                {/* Font preview */}
                {(style.headingFont || style.bodyFont) && (
                    <div className="mt-3 rounded-lg border border-desert-tan-dark/40 bg-white/60 p-4 dark:border-dark-muted/40 dark:bg-dark-bg/60">
                        <p className="mb-1 text-xs font-medium text-olive dark:text-dark-muted">Preview</p>
                        {style.headingFont && (
                            <p className="text-xl font-bold text-chestnut dark:text-dark-text" style={{ fontFamily: `"${style.headingFont}", sans-serif` }}>
                                Heading in {style.headingFont}
                            </p>
                        )}
                        {style.bodyFont && (
                            <p className="text-sm text-chestnut-dark dark:text-dark-muted" style={{ fontFamily: `"${style.bodyFont}", sans-serif` }}>
                                Body text sample in {style.bodyFont}. The quick brown fox jumps over the lazy dog.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* ── Colors ── */}
            <div className={groupClass}>
                <p className={groupTitleClass}>Colors</p>

                <div className="mb-3">
                    <p className="mb-2 text-xs text-olive dark:text-dark-muted">Leave blank to use theme defaults. Set dark-mode overrides for readability on dark backgrounds.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField label="H1 Color" value={style.h1Color} onChange={(v) => updateStyle({ h1Color: v })} placeholder="#480903" />
                    <ColorField label="H1 Color (dark)" value={style.h1ColorDark} onChange={(v) => updateStyle({ h1ColorDark: v })} placeholder="#e8dcb8" />
                    <ColorField label="H2 Color" value={style.h2Color} onChange={(v) => updateStyle({ h2Color: v })} placeholder="#480903" />
                    <ColorField label="H2 Color (dark)" value={style.h2ColorDark} onChange={(v) => updateStyle({ h2ColorDark: v })} placeholder="#e8dcb8" />
                    <ColorField label="Body Color" value={style.bodyColor} onChange={(v) => updateStyle({ bodyColor: v })} placeholder="#2a0502" />
                    <ColorField label="Body Color (dark)" value={style.bodyColorDark} onChange={(v) => updateStyle({ bodyColorDark: v })} placeholder="#e8dcb8" />
                    <ColorField label="Link Color" value={style.linkColor} onChange={(v) => updateStyle({ linkColor: v })} placeholder="#b64b12" />
                    <ColorField label="Link Color (dark)" value={style.linkColorDark} onChange={(v) => updateStyle({ linkColorDark: v })} placeholder="#e8a060" />
                </div>

                <div className="mt-4 border-t border-desert-tan-dark/20 pt-4 dark:border-dark-muted/20">
                    <p className="mb-3 text-xs font-medium text-olive-dark dark:text-dark-muted">Card / Surface Styling</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ColorField label="Card Background" value={style.cardBg} onChange={(v) => updateStyle({ cardBg: v })} placeholder="#f5ead5" />
                        <ColorField label="Card Bg (dark)" value={style.cardBgDark} onChange={(v) => updateStyle({ cardBgDark: v })} placeholder="#252525" />
                        <ColorField label="Card Border" value={style.cardBorder} onChange={(v) => updateStyle({ cardBorder: v })} placeholder="#d4be8a" />
                        <ColorField label="Card Border (dark)" value={style.cardBorderDark} onChange={(v) => updateStyle({ cardBorderDark: v })} placeholder="#b8a86c" />
                    </div>
                </div>
            </div>
        </div>
    );
}
