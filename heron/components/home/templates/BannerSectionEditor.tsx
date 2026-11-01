"use client";

import type { BannerSectionData } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";

export function BannerSectionEditor({
    sectionId,
    data,
    onChange,
    ui,
    showToast,
    uploadBackgroundImage,
}: SectionEditorProps<BannerSectionData>) {
    const { labelClass, inputClass, textareaClass, btnAdd } = ui;
    return (
        <div className="grid gap-4">
            <div>
                <label className={labelClass}>Title</label>
                <input className={inputClass} value={data.title} onChange={(e) => onChange({ title: e.target.value })} />
            </div>
            <div>
                <label className={labelClass}>Subtitle</label>
                <textarea
                    className={textareaClass}
                    value={data.subtitle}
                    onChange={(e) => onChange({ subtitle: e.target.value })}
                />
            </div>
            <div>
                <label className={labelClass}>Background type</label>
                <select
                    className={inputClass}
                    value={data.backgroundType}
                    onChange={(e) =>
                        onChange({ backgroundType: e.target.value as BannerSectionData["backgroundType"] })
                    }
                >
                    <option value="gradient">Theme gradient (default)</option>
                    <option value="color">Solid color</option>
                    <option value="image">Background image</option>
                </select>
            </div>
            {data.backgroundType === "color" && (
                <div>
                    <label className={labelClass}>Background color</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={data.backgroundColor || "#6B2D2D"}
                            onChange={(e) => onChange({ backgroundColor: e.target.value })}
                            className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark"
                        />
                        <input
                            className={inputClass}
                            value={data.backgroundColor}
                            onChange={(e) => onChange({ backgroundColor: e.target.value })}
                            placeholder="#6B2D2D"
                        />
                    </div>
                </div>
            )}
            {data.backgroundType === "gradient" && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Gradient from</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={data.gradientFrom || "#6B2D2D"}
                                onChange={(e) => onChange({ gradientFrom: e.target.value })}
                                className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark"
                            />
                            <input
                                className={inputClass}
                                value={data.gradientFrom}
                                onChange={(e) => onChange({ gradientFrom: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Gradient to</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={data.gradientTo || "#8B4D4D"}
                                onChange={(e) => onChange({ gradientTo: e.target.value })}
                                className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark"
                            />
                            <input
                                className={inputClass}
                                value={data.gradientTo}
                                onChange={(e) => onChange({ gradientTo: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}
            {data.backgroundType === "image" && uploadBackgroundImage && showToast && (
                <div>
                    <label className={labelClass}>Background image</label>
                    <div className="space-y-3">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            id={`banner-bg-${sectionId}`}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                showToast("Uploading...", "success");
                                try {
                                    const url = await uploadBackgroundImage(file);
                                    onChange({ backgroundImage: url });
                                    showToast("Image uploaded!", "success");
                                } catch {
                                    showToast("Upload failed", "error");
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById(`banner-bg-${sectionId}`)?.click()}
                            className={btnAdd}
                        >
                            Select image
                        </button>
                        <input
                            className={inputClass}
                            value={data.backgroundImage}
                            onChange={(e) => onChange({ backgroundImage: e.target.value })}
                            placeholder="https://…"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
