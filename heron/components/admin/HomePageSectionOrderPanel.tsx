"use client";

import type { FrontPageSettings, BuiltInSectionId } from "@/lib/frontPageDefaults";
import {
    BUILT_IN_SECTION_IDS,
    BUILT_IN_SECTION_LABELS,
    createCustomSection,
    customSectionKey,
    getSectionDisplayLabel,
    parseCustomSectionKey,
} from "@/lib/frontPageDefaults";

type Props = {
    config: FrontPageSettings;
    setConfig: React.Dispatch<React.SetStateAction<FrontPageSettings>>;
    sectionClass: string;
    inputClass: string;
    btnAdd: string;
    btnDanger: string;
};

export default function HomePageSectionOrderPanel({
    config,
    setConfig,
    sectionClass,
    inputClass,
    btnAdd,
    btnDanger,
}: Props) {
    const setSectionOrder = (order: string[]) => setConfig((c) => ({ ...c, sectionOrder: order }));

    const removeFromPage = (key: string) => {
        const customId = parseCustomSectionKey(key);
        if (customId) {
            setConfig((c) => ({
                ...c,
                customSections: c.customSections.filter((s) => s.id !== customId),
                sectionOrder: c.sectionOrder.filter((k) => k !== key),
            }));
            return;
        }
        setSectionOrder(config.sectionOrder.filter((k) => k !== key));
    };

    const moveSection = (index: number, direction: -1 | 1) => {
        const next = [...config.sectionOrder];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setSectionOrder(next);
    };

    const addBuiltInSection = (id: BuiltInSectionId) => {
        if (config.sectionOrder.includes(id)) return;
        setSectionOrder([...config.sectionOrder, id]);
    };

    const addCustomSection = () => {
        const section = createCustomSection();
        setConfig((c) => ({
            ...c,
            customSections: [...c.customSections, section],
            sectionOrder: [...c.sectionOrder, customSectionKey(section.id)],
        }));
    };

    const availableBuiltIns = BUILT_IN_SECTION_IDS.filter((id) => !config.sectionOrder.includes(id));

    return (
        <section className={sectionClass}>
            <h2 className="mb-2 text-lg font-semibold text-chestnut dark:text-dark-text">Homepage sections</h2>
            <p className="mb-4 text-sm text-olive-dark dark:text-dark-muted">
                Choose which sections appear on the home page and their order. Removing a section hides it but
                keeps its content if you add it back later.
            </p>
            {config.sectionOrder.length === 0 ? (
                <p className="text-sm text-olive dark:text-dark-muted">No sections on the page. Add one below.</p>
            ) : (
                <ul className="mb-4 space-y-2">
                    {config.sectionOrder.map((key, index) => (
                        <li
                            key={key}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-desert-tan-dark/50 bg-white/60 px-3 py-2 dark:border-dark-muted/50 dark:bg-dark-bg/40"
                        >
                            <span className="min-w-0 flex-1 text-sm font-medium text-chestnut-dark dark:text-dark-text">
                                {getSectionDisplayLabel(key, config)}
                            </span>
                            <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveSection(index, -1)}
                                className={btnAdd}
                                aria-label="Move up"
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                disabled={index === config.sectionOrder.length - 1}
                                onClick={() => moveSection(index, 1)}
                                className={btnAdd}
                                aria-label="Move down"
                            >
                                ↓
                            </button>
                            <button type="button" onClick={() => removeFromPage(key)} className={btnDanger}>
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex flex-wrap items-center gap-2">
                {availableBuiltIns.length > 0 && (
                    <select
                        className={inputClass}
                        defaultValue=""
                        onChange={(e) => {
                            const id = e.target.value as BuiltInSectionId;
                            if (id) {
                                addBuiltInSection(id);
                                e.target.value = "";
                            }
                        }}
                    >
                        <option value="" disabled>
                            Add section…
                        </option>
                        {availableBuiltIns.map((id) => (
                            <option key={id} value={id}>
                                {BUILT_IN_SECTION_LABELS[id]}
                            </option>
                        ))}
                    </select>
                )}
                <button type="button" onClick={addCustomSection} className={btnAdd}>
                    + Custom text block
                </button>
            </div>
        </section>
    );
}
