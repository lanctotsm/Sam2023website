import type { CertificateEntry, ResumeDocument } from "@/lib/resume/types";
import { formatPartialDate } from "@/lib/resume/format";
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

export function CertificatesSectionView({ doc }: { doc: ResumeDocument }) {
    return (
        <>
            {doc.certificates.map((entry) => (
                <div key={entry.id} className={entryClass}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3">
                        <span className={`font-semibold ${bodyText}`} style={bodyFontStyle}>
                            {entry.url ? (
                                <a href={entry.url} target="_blank" rel="noopener noreferrer" className={linkText}>
                                    {entry.name}
                                </a>
                            ) : (
                                entry.name
                            )}
                        </span>
                        {entry.issuer && <span className={`text-sm ${mutedText}`}>{entry.issuer}</span>}
                        {entry.date && (
                            <span className={`text-sm italic ${mutedText} sm:ml-auto`}>
                                {formatPartialDate(entry.date)}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
}

export function CertificatesSectionEditor({ doc, setDoc, ui }: SectionEditorProps) {
    const updateEntry = (index: number, patch: Partial<CertificateEntry>) => {
        setDoc((d) => ({
            ...d,
            certificates: d.certificates.map((entry, i) =>
                i === index ? { ...entry, ...patch } : entry
            )
        }));
    };

    const addEntry = () => {
        setDoc((d) => ({
            ...d,
            certificates: [
                ...d.certificates,
                { id: generateEntryId(), name: "", date: "", issuer: "", url: "" }
            ]
        }));
    };

    return (
        <div className="grid gap-4">
            {doc.certificates.map((entry, index) => (
                <div key={entry.id} className={entryCardClass}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <TextField label="Name" value={entry.name} ui={ui} onChange={(v) => updateEntry(index, { name: v })} />
                        <TextField label="Issuer" value={entry.issuer} ui={ui} onChange={(v) => updateEntry(index, { issuer: v })} />
                        <TextField label="Date" value={entry.date} ui={ui} placeholder="2023-01" hint="YYYY-MM" onChange={(v) => updateEntry(index, { date: v })} />
                        <TextField label="URL" value={entry.url} ui={ui} placeholder="https://" onChange={(v) => updateEntry(index, { url: v })} />
                    </div>
                    <div className="mt-3 flex justify-end">
                        <EntryControls
                            index={index}
                            count={doc.certificates.length}
                            ui={ui}
                            onMove={(direction) => setDoc((d) => ({ ...d, certificates: moveItem(d.certificates, index, direction) }))}
                            onRemove={() => setDoc((d) => ({ ...d, certificates: d.certificates.filter((c) => c.id !== entry.id) }))}
                        />
                    </div>
                </div>
            ))}
            <div>
                <button type="button" onClick={addEntry} className={ui.btnAdd}>
                    + Add certification
                </button>
            </div>
        </div>
    );
}
