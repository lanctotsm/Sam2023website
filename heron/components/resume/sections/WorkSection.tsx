import type { ResumeDocument, WorkEntry } from "@/lib/resume/types";
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

function CompanyName({ entry }: { entry: WorkEntry }) {
    if (!entry.name) return null;
    if (entry.url) {
        return (
            <a href={entry.url} target="_blank" rel="noopener noreferrer" className={linkText}>
                {entry.name}
            </a>
        );
    }
    return <>{entry.name}</>;
}

function FullEntry({ entry }: { entry: WorkEntry }) {
    return (
        <div className={entryClass}>
            <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3">
                <h3
                    className="m-0 text-xl/tight text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]"
                    style={headingFontStyle}
                >
                    {entry.position || entry.name}
                </h3>
                {entry.position && entry.name && (
                    <span className={`text-base font-semibold ${mutedText}`}>
                        <CompanyName entry={entry} />
                    </span>
                )}
                <span className={`text-sm italic ${mutedText} sm:ml-auto`}>
                    {formatDateRange(entry.startDate, entry.endDate)}
                </span>
            </div>
            {entry.location && <p className={`m-0 mb-1 text-sm ${mutedText}`}>{entry.location}</p>}
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
    );
}

/** The "Earlier" treatment: one line plus a sentence, no bullets. */
function CondensedEntry({ entry }: { entry: WorkEntry }) {
    return (
        <div className={entryClass}>
            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3">
                <span className={`font-semibold ${bodyText}`} style={bodyFontStyle}>
                    {[entry.position, entry.name].filter(Boolean).join(" · ")}
                </span>
                <span className={`text-sm italic ${mutedText} sm:ml-auto`}>
                    {formatDateRange(entry.startDate, entry.endDate)}
                </span>
            </div>
            {entry.summary && (
                <p className={`m-0 mt-1 text-sm leading-relaxed ${mutedText}`} style={bodyFontStyle}>
                    {entry.summary}
                </p>
            )}
        </div>
    );
}

export function WorkSectionView({ doc }: { doc: ResumeDocument }) {
    const condensed = new Set(doc.meta.heron.condensedWorkIds);
    return (
        <>
            {doc.work.map((entry) =>
                condensed.has(entry.id) ? (
                    <CondensedEntry key={entry.id} entry={entry} />
                ) : (
                    <FullEntry key={entry.id} entry={entry} />
                )
            )}
        </>
    );
}

export function WorkSectionEditor({ doc, setDoc, ui }: SectionEditorProps) {
    const updateEntry = (index: number, patch: Partial<WorkEntry>) => {
        setDoc((d) => ({
            ...d,
            work: d.work.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
        }));
    };

    const toggleCondensed = (id: string, condensed: boolean) => {
        setDoc((d) => ({
            ...d,
            meta: {
                ...d.meta,
                heron: {
                    ...d.meta.heron,
                    condensedWorkIds: condensed
                        ? [...d.meta.heron.condensedWorkIds, id]
                        : d.meta.heron.condensedWorkIds.filter((workId) => workId !== id)
                }
            }
        }));
    };

    const removeEntry = (id: string) => {
        setDoc((d) => ({
            ...d,
            work: d.work.filter((entry) => entry.id !== id),
            meta: {
                ...d.meta,
                heron: {
                    ...d.meta.heron,
                    condensedWorkIds: d.meta.heron.condensedWorkIds.filter((workId) => workId !== id)
                }
            }
        }));
    };

    const addEntry = () => {
        setDoc((d) => ({
            ...d,
            work: [
                ...d.work,
                {
                    id: generateEntryId(),
                    name: "",
                    position: "",
                    location: "",
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
            {doc.work.map((entry, index) => (
                <div key={entry.id} className={entryCardClass}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <TextField label="Position" value={entry.position} ui={ui} onChange={(v) => updateEntry(index, { position: v })} />
                        <TextField label="Company" value={entry.name} ui={ui} onChange={(v) => updateEntry(index, { name: v })} />
                        <TextField label="Location" value={entry.location} ui={ui} onChange={(v) => updateEntry(index, { location: v })} />
                        <TextField label="Company URL" value={entry.url} ui={ui} placeholder="https://" onChange={(v) => updateEntry(index, { url: v })} />
                        <TextField label="Start date" value={entry.startDate} ui={ui} placeholder="2021-06" hint="YYYY-MM" onChange={(v) => updateEntry(index, { startDate: v })} />
                        <TextField label="End date" value={entry.endDate} ui={ui} placeholder="2024-01" hint="Leave blank for Present" onChange={(v) => updateEntry(index, { endDate: v })} />
                    </div>
                    <div className="mt-3 grid gap-3">
                        <TextAreaField label="Summary" value={entry.summary} ui={ui} hint="One-line role description" onChange={(v) => updateEntry(index, { summary: v })} />
                        <BulletListEditor label="Highlights" bullets={entry.highlights} ui={ui} onChange={(bullets) => updateEntry(index, { highlights: bullets })} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm text-chestnut-dark dark:text-dark-text">
                            <input
                                type="checkbox"
                                checked={doc.meta.heron.condensedWorkIds.includes(entry.id)}
                                onChange={(e) => toggleCondensed(entry.id, e.target.checked)}
                            />
                            Condensed (one line, no bullets — for earlier roles)
                        </label>
                        <EntryControls
                            index={index}
                            count={doc.work.length}
                            ui={ui}
                            onMove={(direction) => setDoc((d) => ({ ...d, work: moveItem(d.work, index, direction) }))}
                            onRemove={() => removeEntry(entry.id)}
                        />
                    </div>
                </div>
            ))}
            <div>
                <button type="button" onClick={addEntry} className={ui.btnAdd}>
                    + Add role
                </button>
            </div>
        </div>
    );
}
