"use client";

import type { TagListSectionData, TagItem } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import IconPicker from "@/components/IconPicker";
import LucideIcon from "@/components/LucideIcon";
import { homeBodyClass, homeH2Class, homeHeadingStyle } from "@/components/home/homeSectionStyles";

export function TagListSectionView({ data }: { data: TagListSectionData }) {
    return (
        <section>
            <h2 className={`mb-6 ${homeH2Class}`} style={homeHeadingStyle}>
                {data.heading}
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
                {data.items.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center gap-2 rounded-full border border-[var(--page-card-border,var(--color-desert-tan-dark))] bg-[var(--page-card-bg,var(--color-surface))] px-4 py-2.5 text-[0.95rem] ${homeBodyClass} transition-all hover:scale-105 hover:bg-white dark:border-[var(--page-card-border-dark,var(--color-dark-muted))] dark:bg-[var(--page-card-bg-dark,var(--color-dark-surface))] dark:hover:bg-dark-bg`}
                    >
                        <LucideIcon name={item.icon} size={20} />
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function TagListSectionEditor({ data, onChange, ui }: SectionEditorProps<TagListSectionData>) {
    const { labelClass, inputClass, btnDanger, btnAdd } = ui;
    const updateItem = (index: number, patch: Partial<TagItem>) =>
        onChange({ items: data.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
    return (
        <div className="grid gap-4">
            <div>
                <label className={labelClass}>Section heading</label>
                <input
                    className={inputClass}
                    value={data.heading}
                    onChange={(e) => onChange({ heading: e.target.value })}
                />
            </div>
            {data.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                    <IconPicker value={item.icon} onChange={(icon) => updateItem(i, { icon })} />
                    <input
                        className={inputClass}
                        value={item.label}
                        onChange={(e) => updateItem(i, { label: e.target.value })}
                        placeholder="Label"
                    />
                    <button
                        type="button"
                        onClick={() => onChange({ items: data.items.filter((_, j) => j !== i) })}
                        className={btnDanger}
                    >
                        ×
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange({ items: [...data.items, { icon: "Star", label: "" }] })}
                className={btnAdd}
            >
                + Add tag
            </button>
        </div>
    );
}
