import type { ProjectEntry, ResumeDocument } from "@/lib/resume/types";
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

export function ProjectsSectionView({ doc }: { doc: ResumeDocument }) {
    return (
        <>
            {doc.projects.map((entry) => (
                <div key={entry.id} className={entryClass}>
                    <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3">
                        <h3
                            className="m-0 text-xl/tight text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]"
                            style={headingFontStyle}
                        >
                            {entry.url ? (
                                <a href={entry.url} target="_blank" rel="noopener noreferrer" className={linkText}>
                                    {entry.name}
                                </a>
                            ) : (
                                entry.name
                            )}
                        </h3>
                        <span className={`text-sm italic ${mutedText} sm:ml-auto`}>
                            {formatDateRange(entry.startDate, entry.endDate)}
                        </span>
                    </div>
                    {entry.description && (
                        <p className={`m-0 leading-relaxed ${bodyText}`} style={bodyFontStyle}>
                            {entry.description}
                        </p>
                    )}
                    {entry.keywords.length > 0 && (
                        <p className={`m-0 mt-1 text-sm ${mutedText}`} style={bodyFontStyle}>
                            {entry.keywords.join(" · ")}
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

export function ProjectsSectionEditor({ doc, setDoc, ui }: SectionEditorProps) {
    const updateEntry = (index: number, patch: Partial<ProjectEntry>) => {
        setDoc((d) => ({
            ...d,
            projects: d.projects.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
        }));
    };

    const addEntry = () => {
        setDoc((d) => ({
            ...d,
            projects: [
                ...d.projects,
                {
                    id: generateEntryId(),
                    name: "",
                    description: "",
                    highlights: [],
                    keywords: [],
                    url: "",
                    startDate: "",
                    endDate: ""
                }
            ]
        }));
    };

    return (
        <div className="grid gap-4">
            {doc.projects.map((entry, index) => (
                <div key={entry.id} className={entryCardClass}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <TextField label="Name" value={entry.name} ui={ui} onChange={(v) => updateEntry(index, { name: v })} />
                        <TextField label="URL" value={entry.url} ui={ui} placeholder="https://" onChange={(v) => updateEntry(index, { url: v })} />
                        <TextField label="Start date" value={entry.startDate} ui={ui} placeholder="2023-01" hint="YYYY-MM" onChange={(v) => updateEntry(index, { startDate: v })} />
                        <TextField label="End date" value={entry.endDate} ui={ui} hint="Leave blank for ongoing" onChange={(v) => updateEntry(index, { endDate: v })} />
                    </div>
                    <div className="mt-3 grid gap-3">
                        <TextAreaField label="Description" value={entry.description} ui={ui} onChange={(v) => updateEntry(index, { description: v })} />
                        <TextField
                            label="Tech (comma-separated)"
                            value={entry.keywords.join(", ")}
                            ui={ui}
                            onChange={(v) =>
                                updateEntry(index, {
                                    keywords: v.split(",").map((k) => k.trim()).filter(Boolean)
                                })
                            }
                        />
                        <BulletListEditor label="Highlights" bullets={entry.highlights} ui={ui} onChange={(bullets) => updateEntry(index, { highlights: bullets })} />
                    </div>
                    <div className="mt-3 flex justify-end">
                        <EntryControls
                            index={index}
                            count={doc.projects.length}
                            ui={ui}
                            onMove={(direction) => setDoc((d) => ({ ...d, projects: moveItem(d.projects, index, direction) }))}
                            onRemove={() => setDoc((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== entry.id) }))}
                        />
                    </div>
                </div>
            ))}
            <div>
                <button type="button" onClick={addEntry} className={ui.btnAdd}>
                    + Add project
                </button>
            </div>
        </div>
    );
}
