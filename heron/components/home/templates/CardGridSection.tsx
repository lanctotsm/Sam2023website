"use client";

import type { CardGridSectionData, CardItem } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import IconPicker from "@/components/IconPicker";
import LucideIcon from "@/components/LucideIcon";
import {
    homeBodyStyle,
    homeCardClass,
    homeH2Class,
    homeHeadingStyle,
} from "@/components/home/homeSectionStyles";

export function CardGridSectionView({ data }: { data: CardGridSectionData }) {
    const gridCols =
        data.columns === 1
            ? "grid-cols-1"
            : data.columns === 3
              ? "sm:grid-cols-3"
              : data.columns === 4
                ? "sm:grid-cols-2 lg:grid-cols-4"
                : "sm:grid-cols-2";
    return (
        <section>
            <h2 className={`mb-6 ${homeH2Class}`} style={homeHeadingStyle}>
                {data.heading}
            </h2>
            <div className={`grid gap-5 ${gridCols}`}>
                {data.items.map((item, idx) => (
                    <div
                        key={idx}
                        className={`${homeCardClass} p-6 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(72,9,3,0.12)] dark:hover:shadow-none`}
                    >
                        <div className={`mb-3 flex justify-center ${homeH2Class}`}>
                            <LucideIcon name={item.icon} size={36} />
                        </div>
                        <h3 className={`mb-3 text-lg ${homeH2Class}`} style={homeHeadingStyle}>
                            {item.title}
                        </h3>
                        <p
                            className="text-sm leading-relaxed text-[var(--page-body-color,var(--color-olive-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]"
                            style={homeBodyStyle}
                        >
                            {item.text}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function CardGridSectionEditor({ data, onChange, ui }: SectionEditorProps<CardGridSectionData>) {
    const { labelClass, inputClass, textareaClass, btnDanger, btnAdd } = ui;
    const updateItem = (index: number, patch: Partial<CardItem>) =>
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
            <div>
                <label className={labelClass}>Columns ({data.columns})</label>
                <input
                    type="range"
                    min={1}
                    max={4}
                    value={data.columns}
                    onChange={(e) => onChange({ columns: Number(e.target.value) })}
                    className="w-full accent-chestnut dark:accent-caramel"
                />
            </div>
            {data.items.map((item, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-desert-tan-dark/50 bg-white/50 p-4 dark:border-dark-muted/50 dark:bg-dark-bg/50"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-chestnut-dark dark:text-dark-text">
                            Card {i + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => onChange({ items: data.items.filter((_, j) => j !== i) })}
                            className={btnDanger}
                        >
                            Remove
                        </button>
                    </div>
                    <div className="grid gap-3">
                        <IconPicker value={item.icon} onChange={(icon) => updateItem(i, { icon })} />
                        <input
                            className={inputClass}
                            value={item.title}
                            onChange={(e) => updateItem(i, { title: e.target.value })}
                            placeholder="Title"
                        />
                        <textarea
                            className={textareaClass}
                            value={item.text}
                            onChange={(e) => updateItem(i, { text: e.target.value })}
                            placeholder="Description"
                        />
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange({ items: [...data.items, { icon: "Star", title: "", text: "" }] })}
                className={btnAdd}
            >
                + Add card
            </button>
        </div>
    );
}
