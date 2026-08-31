"use client";

import type { PostsListSectionData } from "@/lib/postsPage";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";

export function PostsListSectionView({ data }: { data: PostsListSectionData }) {
    const heading = data.heading?.trim() || "Posts";
    return (
        <section className="grid gap-4">
            <h2 className="heading-rule m-0 font-bold text-chestnut dark:text-dark-text">{heading}</h2>
            <p className="text-sm text-olive dark:text-dark-muted">Blog posts from the CMS appear here.</p>
        </section>
    );
}

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
