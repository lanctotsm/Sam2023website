"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ResumeDocument } from "@/lib/resume/types";
import { isStandardSectionId } from "@/lib/resume/defaults";
import { RESUME_SECTION_REGISTRY } from "@/components/resume/resumeSectionRegistry";
import {
    generateEntryId,
    moveItem,
    type AdminUi
} from "@/components/admin/resumeEditorShared";

type Props = {
    doc: ResumeDocument;
    setDoc: Dispatch<SetStateAction<ResumeDocument>>;
    sectionClass: string;
    ui: AdminUi;
};

export default function ResumeSectionOrderPanel({ doc, setDoc, sectionClass, ui }: Props) {
    const { sectionOrder, hiddenSections, customSections } = doc.meta.heron;
    const customById = new Map(customSections.map((section) => [section.id, section]));

    const setHeron = (patch: Partial<ResumeDocument["meta"]["heron"]>) => {
        setDoc((d) => ({
            ...d,
            meta: { ...d.meta, heron: { ...d.meta.heron, ...patch } }
        }));
    };

    const toggleHidden = (id: string) => {
        setHeron({
            hiddenSections: hiddenSections.includes(id)
                ? hiddenSections.filter((sectionId) => sectionId !== id)
                : [...hiddenSections, id]
        });
    };

    const removeCustomSection = (id: string) => {
        setHeron({
            customSections: customSections.filter((section) => section.id !== id),
            sectionOrder: sectionOrder.filter((sectionId) => sectionId !== id),
            hiddenSections: hiddenSections.filter((sectionId) => sectionId !== id)
        });
    };

    const addCustomSection = () => {
        const section = { id: generateEntryId(), heading: "New section", entries: [] };
        setHeron({
            customSections: [...customSections, section],
            sectionOrder: [...sectionOrder, section.id]
        });
    };

    return (
        <section className={sectionClass}>
            <h2 className="mb-2 text-lg font-semibold text-chestnut dark:text-dark-text">Sections</h2>
            <p className="mb-4 text-sm text-olive-dark dark:text-dark-muted">
                Reorder or hide sections without losing their content. Hidden sections stay editable
                below but are excluded from the page, the PDF, and print.
            </p>
            <ul className="mb-4 space-y-2">
                {sectionOrder.map((id, index) => {
                    const isStandard = isStandardSectionId(id);
                    const label = isStandard
                        ? RESUME_SECTION_REGISTRY[id].label
                        : customById.get(id)?.heading || "Custom section";
                    const isHidden = hiddenSections.includes(id);
                    return (
                        <li
                            key={id}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-desert-tan-dark/50 bg-white/60 px-3 py-2 dark:border-dark-muted/50 dark:bg-dark-bg/40"
                        >
                            <span className="min-w-0 flex-1 text-sm font-medium text-chestnut-dark dark:text-dark-text">
                                {label}
                                {!isStandard && (
                                    <span className="ml-2 text-xs font-normal text-olive dark:text-dark-muted">
                                        (custom)
                                    </span>
                                )}
                                {isHidden && (
                                    <span className="ml-2 text-xs font-normal text-olive dark:text-dark-muted">
                                        hidden
                                    </span>
                                )}
                            </span>
                            <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => setHeron({ sectionOrder: moveItem(sectionOrder, index, -1) })}
                                className={ui.btnAdd}
                                aria-label="Move up"
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                disabled={index === sectionOrder.length - 1}
                                onClick={() => setHeron({ sectionOrder: moveItem(sectionOrder, index, 1) })}
                                className={ui.btnAdd}
                                aria-label="Move down"
                            >
                                ↓
                            </button>
                            <button type="button" onClick={() => toggleHidden(id)} className={ui.btnAdd}>
                                {isHidden ? "Show" : "Hide"}
                            </button>
                            {!isStandard && (
                                <button
                                    type="button"
                                    onClick={() => removeCustomSection(id)}
                                    className={ui.btnDanger}
                                >
                                    Remove
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
            <button type="button" onClick={addCustomSection} className={ui.btnAdd}>
                + Add custom section
            </button>
        </section>
    );
}
