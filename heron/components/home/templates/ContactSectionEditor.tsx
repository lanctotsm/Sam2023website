"use client";

import type { ContactSectionData, ContactLink } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import IconPicker from "@/components/IconPicker";
import LucideIcon from "@/components/LucideIcon";

export function ContactSectionEditor({ data, onChange, ui }: SectionEditorProps<ContactSectionData>) {
    const { labelClass, inputClass, textareaClass, btnDanger, btnAdd } = ui;
    const updateLink = (index: number, patch: Partial<ContactLink>) =>
        onChange({ links: data.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) });
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
                <label className={labelClass}>Description</label>
                <textarea
                    className={textareaClass}
                    value={data.text}
                    onChange={(e) => onChange({ text: e.target.value })}
                />
            </div>
            <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-chestnut-dark dark:text-dark-text">
                    Show social links
                </label>
                <button
                    type="button"
                    onClick={() => onChange({ showSocials: !data.showSocials })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${data.showSocials ? "bg-chestnut dark:bg-caramel" : "bg-desert-tan-dark dark:bg-dark-muted"}`}
                >
                    <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.showSocials ? "left-[22px]" : "left-0.5"}`}
                    />
                </button>
            </div>
            {data.showSocials &&
                data.links.map((link, i) => (
                    <div
                        key={i}
                        className="rounded-lg border border-desert-tan-dark/50 bg-white/50 p-4 dark:border-dark-muted/50 dark:bg-dark-bg/50"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <LucideIcon name={link.icon} size={18} />
                            <button
                                type="button"
                                onClick={() => onChange({ links: data.links.filter((_, j) => j !== i) })}
                                className={btnDanger}
                            >
                                Remove
                            </button>
                        </div>
                        <div className="grid gap-3">
                            <IconPicker value={link.icon} onChange={(icon) => updateLink(i, { icon })} />
                            <input
                                className={inputClass}
                                value={link.label}
                                onChange={(e) => updateLink(i, { label: e.target.value })}
                            />
                            <input
                                className={inputClass}
                                value={link.url}
                                onChange={(e) => updateLink(i, { url: e.target.value })}
                            />
                        </div>
                    </div>
                ))}
            {data.showSocials && (
                <button
                    type="button"
                    onClick={() => onChange({ links: [...data.links, { icon: "Link", label: "", url: "" }] })}
                    className={btnAdd}
                >
                    + Add link
                </button>
            )}
        </div>
    );
}
