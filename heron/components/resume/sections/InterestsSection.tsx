import type { InterestGroup, ResumeDocument } from "@/lib/resume/types";
import {
    EntryControls,
    TextField,
    entryCardClass,
    generateEntryId,
    moveItem,
    type SectionEditorProps
} from "@/components/admin/resumeEditorShared";
import { bodyFontStyle, bodyText, mutedText } from "@/components/resume/styles";

export function InterestsSectionView({ doc }: { doc: ResumeDocument }) {
    return (
        <div className="mt-4 grid gap-5">
            {doc.interests.map((group) => (
                <div key={group.id}>
                    {group.name && (
                        <h3 className={`mb-2 text-xs uppercase tracking-wide ${mutedText}`}>{group.name}</h3>
                    )}
                    <p className={`m-0 leading-relaxed ${bodyText}`} style={bodyFontStyle}>
                        {group.keywords.join(", ")}
                    </p>
                </div>
            ))}
        </div>
    );
}

export function InterestsSectionEditor({ doc, setDoc, ui }: SectionEditorProps) {
    const updateGroup = (index: number, patch: Partial<InterestGroup>) => {
        setDoc((d) => ({
            ...d,
            interests: d.interests.map((group, i) => (i === index ? { ...group, ...patch } : group))
        }));
    };

    const addGroup = () => {
        setDoc((d) => ({
            ...d,
            interests: [...d.interests, { id: generateEntryId(), name: "", keywords: [] }]
        }));
    };

    return (
        <div className="grid gap-4">
            {doc.interests.map((group, index) => (
                <div key={group.id} className={entryCardClass}>
                    <div className="grid gap-3">
                        <TextField
                            label="Name"
                            value={group.name}
                            ui={ui}
                            placeholder="Music"
                            onChange={(v) => updateGroup(index, { name: v })}
                        />
                        <TextField
                            label="Keywords (comma-separated)"
                            value={group.keywords.join(", ")}
                            ui={ui}
                            onChange={(v) =>
                                updateGroup(index, {
                                    keywords: v.split(",").map((k) => k.trim()).filter(Boolean)
                                })
                            }
                        />
                    </div>
                    <div className="mt-3 flex justify-end">
                        <EntryControls
                            index={index}
                            count={doc.interests.length}
                            ui={ui}
                            onMove={(direction) =>
                                setDoc((d) => ({
                                    ...d,
                                    interests: moveItem(d.interests, index, direction)
                                }))
                            }
                            onRemove={() =>
                                setDoc((d) => ({
                                    ...d,
                                    interests: d.interests.filter((g) => g.id !== group.id)
                                }))
                            }
                        />
                    </div>
                </div>
            ))}
            <div>
                <button type="button" onClick={addGroup} className={ui.btnAdd}>
                    + Add interest
                </button>
            </div>
        </div>
    );
}
