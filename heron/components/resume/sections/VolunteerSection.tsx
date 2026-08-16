import type { ResumeDocument, VolunteerEntry } from "@/lib/resume/types";
import { formatDateRange } from "@/lib/resume/format";
import BulletListEditor from "@/components/admin/BulletListEditor";
import {
    EntryControls,
    TextAreaField,
    TextField,
    entryCardClass,
    generateEntryId,
    moveItem,
    type SectionEditorProps
} from "@/components/admin/resumeEditorShared";
import {
    bodyFontStyle,
    bodyText,
    entryClass,
    headingFontStyle,
    linkText,
    mutedText
} from "@/components/resume/styles";

export function VolunteerSectionView({ doc }: { doc: ResumeDocument }) {
    return (
        <>
            {doc.volunteer.map((entry) => (
                <div key={entry.id} className={entryClass}>
                    <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3">
                        <h3
                            className="m-0 text-xl/tight text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]"
                            style={headingFontStyle}
                        >
                            {entry.position || entry.organization}
                        </h3>
                        {entry.position && entry.organization && (
                            <span className={`text-base font-semibold ${mutedText}`}>
                                {entry.url ? (
                                    <a
                                        href={entry.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={linkText}
                                    >
                                        {entry.organization}
                                    </a>
                                ) : (
                                    entry.organization
                                )}
                            </span>
                        )}
                        <span className={`text-sm italic ${mutedText} sm:ml-auto`}>
                            {formatDateRange(entry.startDate, entry.endDate)}
                        </span>
                    </div>
                    {entry.summary && (
                        <p className={`m-0 italic leading-relaxed ${bodyText}`} style={bodyFontStyle}>
                            {entry.summary}
                        </p>
                    )}
                    {entry.highlights.length > 0 && (
                        <ul
                            className={`mb-0 mt-2 list-outside pl-6 leading-relaxed ${bodyText} [&>li]:mb-1.5`}
                            style={bodyFontStyle}
                        >
                            {entry.highlights.map((highlight, index) => (
                                <li key={index}>{highlight}</li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </>
    );
}

export function VolunteerSectionEditor({ doc, setDoc, ui }: SectionEditorProps) {
    const updateEntry = (index: number, patch: Partial<VolunteerEntry>) => {
        setDoc((d) => ({
            ...d,
            volunteer: d.volunteer.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
        }));
    };

    const addEntry = () => {
        setDoc((d) => ({
            ...d,
            volunteer: [
                ...d.volunteer,
                {
                    id: generateEntryId(),
                    organization: "",
                    position: "",
                    url: "",
                    startDate: "",
                    endDate: "",
                    summary: "",
                    highlights: []
                }
            ]
        }));
    };

    return (
        <div className="grid gap-4">
            {doc.volunteer.map((entry, index) => (
                <div key={entry.id} className={entryCardClass}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <TextField
                            label="Position"
                            value={entry.position}
                            ui={ui}
                            onChange={(v) => updateEntry(index, { position: v })}
                        />
                        <TextField
                            label="Organization"
                            value={entry.organization}
                            ui={ui}
                            onChange={(v) => updateEntry(index, { organization: v })}
                        />
                        <TextField
                            label="URL"
                            value={entry.url}
                            ui={ui}
                            placeholder="https://"
                            onChange={(v) => updateEntry(index, { url: v })}
                        />
                        <TextField
                            label="Start date"
                            value={entry.startDate}
                            ui={ui}
                            placeholder="2020-01"
                            hint="YYYY-MM"
                            onChange={(v) => updateEntry(index, { startDate: v })}
                        />
                        <TextField
                            label="End date"
                            value={entry.endDate}
                            ui={ui}
                            placeholder="Leave blank for Present"
                            onChange={(v) => updateEntry(index, { endDate: v })}
                        />
                    </div>
                    <div className="mt-3">
                        <TextAreaField
                            label="Summary"
                            value={entry.summary}
                            ui={ui}
                            onChange={(v) => updateEntry(index, { summary: v })}
                        />
                    </div>
                    <div className="mt-3">
                        <BulletListEditor
                            label="Highlights"
                            bullets={entry.highlights}
                            ui={ui}
                            onChange={(highlights) => updateEntry(index, { highlights })}
                        />
                    </div>
                    <div className="mt-3 flex justify-end">
                        <EntryControls
                            index={index}
                            count={doc.volunteer.length}
                            ui={ui}
                            onMove={(direction) =>
                                setDoc((d) => ({
                                    ...d,
                                    volunteer: moveItem(d.volunteer, index, direction)
                                }))
                            }
                            onRemove={() =>
                                setDoc((d) => ({
                                    ...d,
                                    volunteer: d.volunteer.filter((e) => e.id !== entry.id)
                                }))
                            }
                        />
                    </div>
                </div>
            ))}
            <div>
                <button type="button" onClick={addEntry} className={ui.btnAdd}>
                    + Add volunteer role
                </button>
            </div>
        </div>
    );
}
