"use client";

import type { RecentWorkSectionData } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";

export function RecentWorkSectionEditor({
    sectionId,
    data,
    onChange,
    ui,
}: SectionEditorProps<RecentWorkSectionData>) {
    const { labelClass, inputClass } = ui;
    return (
        <div className="grid gap-4">
            <div>
                <label className={labelClass} htmlFor={`${sectionId}-heading`}>Heading</label>
                <input
                    id={`${sectionId}-heading`}
                    className={inputClass}
                    value={data.heading}
                    onChange={(e) => onChange({ heading: e.target.value })}
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass} htmlFor={`${sectionId}-album-limit`}>Albums to show</label>
                    <input
                        id={`${sectionId}-album-limit`}
                        className={inputClass}
                        type="number"
                        min={1}
                        max={12}
                        value={data.albumLimit}
                        onChange={(e) => onChange({ albumLimit: Number(e.target.value) })}
                    />
                </div>
                <div>
                    <label className={labelClass} htmlFor={`${sectionId}-post-limit`}>Posts to show</label>
                    <input
                        id={`${sectionId}-post-limit`}
                        className={inputClass}
                        type="number"
                        min={1}
                        max={12}
                        value={data.postLimit}
                        onChange={(e) => onChange({ postLimit: Number(e.target.value) })}
                    />
                </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-chestnut-dark dark:text-dark-text">
                <input
                    type="checkbox"
                    checked={data.showAlbums}
                    onChange={(e) => onChange({ showAlbums: e.target.checked })}
                />
                Show albums
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-chestnut-dark dark:text-dark-text">
                <input
                    type="checkbox"
                    checked={data.showPosts}
                    onChange={(e) => onChange({ showPosts: e.target.checked })}
                />
                Show posts
            </label>
        </div>
    );
}
