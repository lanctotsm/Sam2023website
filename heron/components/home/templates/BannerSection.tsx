"use client";

import type { BannerSectionData } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import { homeBodyStyle, homeHeadingStyle } from "@/components/home/homeSectionStyles";

function bannerStyle(data: BannerSectionData): React.CSSProperties {
    switch (data.backgroundType) {
        case "image": {
            const isSafe = /^https?:\/\/|^\//.test(data.backgroundImage);
            if (!isSafe) return {};
            return {
                backgroundImage: `url(${data.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            };
        }
        case "color":
            return { backgroundColor: data.backgroundColor };
        case "gradient":
        default:
            if (data.gradientFrom && data.gradientTo) {
                return {
                    background: `linear-gradient(to bottom right, ${data.gradientFrom}, ${data.gradientTo})`,
                };
            }
            return {};
    }
}

function hasCustomBackground(data: BannerSectionData): boolean {
    if (data.backgroundType === "color" && data.backgroundColor) return true;
    if (data.backgroundType === "image" && data.backgroundImage) return true;
    if (data.backgroundType === "gradient" && data.gradientFrom && data.gradientTo) return true;
    return false;
}

export function BannerSectionView({ data }: { data: BannerSectionData }) {
    const customBg = hasCustomBackground(data);
    return (
        <section
            className={`-mx-5 mt-0 rounded-2xl px-5 py-12 text-center md:-mx-5 md:px-10 md:py-20 ${
                customBg
                    ? "text-white"
                    : "bg-gradient-to-br from-chestnut to-chestnut-light text-desert-tan dark:from-chestnut-dark dark:to-chestnut"
            }`}
            style={customBg ? bannerStyle(data) : undefined}
        >
            <h1
                className={`mb-4 text-3xl font-bold md:text-5xl ${customBg ? "" : "text-desert-tan"}`}
                style={homeHeadingStyle}
            >
                {data.title}
            </h1>
            <p
                className={`mx-auto max-w-[600px] text-lg leading-relaxed md:text-xl ${customBg ? "text-white/90" : "text-desert-tan-light"}`}
                style={homeBodyStyle}
            >
                {data.subtitle}
            </p>
        </section>
    );
}

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
