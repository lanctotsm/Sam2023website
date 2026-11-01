"use client";

import type { PostsListSectionData } from "@/lib/postsPage";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";

export function PostsListSectionEditor({
    data,
    onChange,
    ui,
}: SectionEditorProps<PostsListSectionData>) {
    const { labelClass, inputClass } = ui;
    return (
        <div>
            <label className={labelClass}>Section heading</label>
            <input
                className={inputClass}
                value={data.heading}
                onChange={(e) => onChange({ heading: e.target.value })}
                placeholder="Posts"
            />
        </div>
    );
}
