"use client";

import type { TagListSectionData, TagItem } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import IconPicker from "@/components/IconPicker";

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
