import type { CustomSection, CustomSectionEntry } from "@/lib/resume/types";
import BulletListEditor from "@/components/admin/BulletListEditor";
import {
    EntryControls,
    TextAreaField,
    TextField,
    entryCardClass,
    generateEntryId,
    moveItem,
    type AdminUi
} from "@/components/admin/resumeEditorShared";
import {
    bodyFontStyle,
    bodyText,
    entryClass,
    headingFontStyle,
    mutedText
} from "@/components/resume/styles";

export function CustomSectionView({ section }: { section: CustomSection }) {
    return (
        <>
            {section.entries.map((entry) => (
                <div key={entry.id} className={entryClass}>
                    <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3">
                        {entry.title && (
                            <h3
                                className="m-0 text-xl/tight text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]"
                                style={headingFontStyle}
                            >
                                {entry.title}
                            </h3>
                        )}
                        {entry.subtitle && (
                            <span className={`text-sm ${mutedText} sm:ml-auto`}>{entry.subtitle}</span>
                        )}
                    </div>
                    {entry.detail && (
                        <p className={`m-0 leading-relaxed ${bodyText}`} style={bodyFontStyle}>
                            {entry.detail}
                        </p>
                    )}
                    {entry.bullets.length > 0 && (
                        <ul
                            className={`mb-0 mt-2 list-outside pl-6 leading-relaxed ${bodyText} [&>li]:mb-1.5`}
                            style={bodyFontStyle}
                        >
                            {entry.bullets.map((bullet, index) => (
                                <li key={index}>{bullet}</li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </>
    );
}

export function CustomSectionEditor({
    section,
    onChange,
    ui
}: {
    section: CustomSection;
    onChange: (section: CustomSection) => void;
    ui: AdminUi;
}) {
    const updateEntry = (index: number, patch: Partial<CustomSectionEntry>) => {
        onChange({
            ...section,
            entries: section.entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
        });
    };

    const addEntry = () => {
        onChange({
            ...section,
            entries: [
                ...section.entries,
                { id: generateEntryId(), title: "", subtitle: "", detail: "", bullets: [] }
            ]
        });
    };

    return (
        <div className="grid gap-4">
            <TextField
                label="Section heading"
                value={section.heading}
                ui={ui}
                onChange={(v) => onChange({ ...section, heading: v })}
            />
            {section.entries.map((entry, index) => (
                <div key={entry.id} className={entryCardClass}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <TextField label="Title" value={entry.title} ui={ui} onChange={(v) => updateEntry(index, { title: v })} />
                        <TextField label="Subtitle" value={entry.subtitle} ui={ui} onChange={(v) => updateEntry(index, { subtitle: v })} />
                    </div>
                    <div className="mt-3 grid gap-3">
                        <TextAreaField label="Detail" value={entry.detail} ui={ui} onChange={(v) => updateEntry(index, { detail: v })} />
                        <BulletListEditor label="Bullets" bullets={entry.bullets} ui={ui} onChange={(bullets) => updateEntry(index, { bullets })} />
                    </div>
                    <div className="mt-3 flex justify-end">
                        <EntryControls
                            index={index}
                            count={section.entries.length}
                            ui={ui}
                            onMove={(direction) =>
                                onChange({ ...section, entries: moveItem(section.entries, index, direction) })
                            }
                            onRemove={() =>
                                onChange({
                                    ...section,
                                    entries: section.entries.filter((e) => e.id !== entry.id)
                                })
                            }
                        />
                    </div>
                </div>
            ))}
            <div>
                <button type="button" onClick={addEntry} className={ui.btnAdd}>
                    + Add entry
                </button>
            </div>
        </div>
    );
}
