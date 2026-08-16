import type { EducationEntry, ResumeDocument } from "@/lib/resume/types";
import { formatDateRange } from "@/lib/resume/format";
import {
    EntryControls,
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
    linkText,
    mutedText
} from "@/components/resume/styles";

export function EducationSectionView({ doc }: { doc: ResumeDocument }) {
    return (
        <>
            {doc.education.map((entry) => (
                <div key={entry.id} className={entryClass}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3">
                        <span className={`font-semibold ${bodyText}`} style={bodyFontStyle}>
                            {entry.url ? (
                                <a href={entry.url} target="_blank" rel="noopener noreferrer" className={linkText}>
                                    {entry.institution}
                                </a>
                            ) : (
                                entry.institution
                            )}
                        </span>
                        <span className={`text-sm ${mutedText}`}>
                            {[entry.studyType, entry.area].filter(Boolean).join(" ")}
                        </span>
                        <span className={`text-sm italic ${mutedText} sm:ml-auto`}>
                            {formatDateRange(entry.startDate, entry.endDate)}
                        </span>
                    </div>
                </div>
            ))}
        </>
    );
}

export function EducationSectionEditor({ doc, setDoc, ui }: SectionEditorProps) {
    const updateEntry = (index: number, patch: Partial<EducationEntry>) => {
        setDoc((d) => ({
            ...d,
            education: d.education.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
        }));
    };

    const addEntry = () => {
        setDoc((d) => ({
            ...d,
            education: [
                ...d.education,
                {
                    id: generateEntryId(),
                    institution: "",
                    area: "",
                    studyType: "",
                    startDate: "",
                    endDate: "",
                    url: ""
                }
            ]
        }));
    };

    return (
        <div className="grid gap-4">
            {doc.education.map((entry, index) => (
                <div key={entry.id} className={entryCardClass}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <TextField label="Institution" value={entry.institution} ui={ui} onChange={(v) => updateEntry(index, { institution: v })} />
                        <TextField label="URL" value={entry.url} ui={ui} placeholder="https://" onChange={(v) => updateEntry(index, { url: v })} />
                        <TextField label="Degree" value={entry.studyType} ui={ui} placeholder="B.S." onChange={(v) => updateEntry(index, { studyType: v })} />
                        <TextField label="Area of study" value={entry.area} ui={ui} placeholder="Computer Engineering" onChange={(v) => updateEntry(index, { area: v })} />
                        <TextField label="Start date" value={entry.startDate} ui={ui} placeholder="2012-08" hint="YYYY-MM" onChange={(v) => updateEntry(index, { startDate: v })} />
                        <TextField label="End date" value={entry.endDate} ui={ui} placeholder="2016-05" onChange={(v) => updateEntry(index, { endDate: v })} />
                    </div>
                    <div className="mt-3 flex justify-end">
                        <EntryControls
                            index={index}
                            count={doc.education.length}
                            ui={ui}
                            onMove={(direction) => setDoc((d) => ({ ...d, education: moveItem(d.education, index, direction) }))}
                            onRemove={() => setDoc((d) => ({ ...d, education: d.education.filter((e) => e.id !== entry.id) }))}
                        />
                    </div>
                </div>
            ))}
            <div>
                <button type="button" onClick={addEntry} className={ui.btnAdd}>
                    + Add education
                </button>
            </div>
        </div>
    );
}
