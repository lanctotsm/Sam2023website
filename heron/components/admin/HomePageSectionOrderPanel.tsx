"use client";

import type { FrontPageSettings, HomeSectionType } from "@/lib/frontPageDefaults";
import {
    createHomeSection,
    createTextBlockSection,
    getSectionDisplayLabel,
    HOME_SECTION_TYPES,
    SECTION_TYPE_LABELS,
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

    const removeFromPage = (id: string) => {
        setSectionOrder(config.sectionOrder.filter((k) => k !== id));
    };

    const moveSection = (index: number, direction: -1 | 1) => {
        const next = [...config.sectionOrder];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setSectionOrder(next);
    };

    const addSectionToPage = (id: string) => {
        if (config.sectionOrder.includes(id)) return;
        setSectionOrder([...config.sectionOrder, id]);
    };

    const addNewSection = (type: HomeSectionType) => {
        const section = createHomeSection(type);
        setConfig((c) => ({
            ...c,
            sections: [...c.sections, section],
            sectionOrder: [...c.sectionOrder, section.id],
        }));
    };

    const addTextBlock = () => {
        const section = createTextBlockSection();
        setConfig((c) => ({
            ...c,
            sections: [...c.sections, section],
            sectionOrder: [...c.sectionOrder, section.id],
        }));
    };

    const hiddenSections = config.sections.filter((s) => !config.sectionOrder.includes(s.id));

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
                    {config.sectionOrder.map((id, index) => {
                        const section = config.sections.find((s) => s.id === id);
                        if (!section) return null;
                        return (
                            <li
                                key={id}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-desert-tan-dark/50 bg-white/60 px-3 py-2 dark:border-dark-muted/50 dark:bg-dark-bg/40"
                            >
                                <span className="min-w-0 flex-1 text-sm font-medium text-chestnut-dark dark:text-dark-text">
                                    {getSectionDisplayLabel(section)}
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
                                <button type="button" onClick={() => removeFromPage(id)} className={btnDanger}>
                                    Remove
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
            <div className="flex flex-wrap items-center gap-2">
                {hiddenSections.length > 0 && (
                    <select
                        className={inputClass}
                        defaultValue=""
                        onChange={(e) => {
                            const id = e.target.value;
                            if (id) {
                                addSectionToPage(id);
                                e.target.value = "";
                            }
                        }}
                    >
                        <option value="" disabled>
                            Add existing section…
                        </option>
                        {hiddenSections.map((section) => (
                            <option key={section.id} value={section.id}>
                                {getSectionDisplayLabel(section)}
                            </option>
                        ))}
                    </select>
                )}
                <select
                    className={inputClass}
                    defaultValue=""
                    onChange={(e) => {
                        const type = e.target.value as HomeSectionType;
                        if (type) {
                            addNewSection(type);
                            e.target.value = "";
                        }
                    }}
                >
                    <option value="" disabled>
                        Add new section type…
                    </option>
                    {HOME_SECTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {SECTION_TYPE_LABELS[type]}
                        </option>
                    ))}
                </select>
                <button type="button" onClick={addTextBlock} className={btnAdd}>
                    + Text block
                </button>
            </div>
        </section>
    );
}
