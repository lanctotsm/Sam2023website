import type { ResumeDocument, SkillGroup } from "@/lib/resume/types";
import {
    EntryControls,
    TextField,
    entryCardClass,
    generateEntryId,
    moveItem,
    type SectionEditorProps
} from "@/components/admin/resumeEditorShared";
import { bodyFontStyle, bodyText, mutedText } from "@/components/resume/styles";

export function SkillsSectionView({ doc }: { doc: ResumeDocument }) {
    return (
        <div className="mt-4 grid gap-5">
            {doc.skills.map((group) => (
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

export function SkillsSectionEditor({ doc, setDoc, ui }: SectionEditorProps) {
    const updateGroup = (index: number, patch: Partial<SkillGroup>) => {
        setDoc((d) => ({
            ...d,
            skills: d.skills.map((group, i) => (i === index ? { ...group, ...patch } : group))
        }));
    };

    const addGroup = () => {
        setDoc((d) => ({
            ...d,
            skills: [...d.skills, { id: generateEntryId(), name: "", keywords: [] }]
        }));
    };

    return (
        <div className="grid gap-4">
            {doc.skills.map((group, index) => (
                <div key={group.id} className={entryCardClass}>
                    <div className="grid gap-3">
                        <TextField label="Group name" value={group.name} ui={ui} placeholder="Primary" onChange={(v) => updateGroup(index, { name: v })} />
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
                            count={doc.skills.length}
                            ui={ui}
                            onMove={(direction) => setDoc((d) => ({ ...d, skills: moveItem(d.skills, index, direction) }))}
                            onRemove={() => setDoc((d) => ({ ...d, skills: d.skills.filter((g) => g.id !== group.id) }))}
                        />
                    </div>
                </div>
            ))}
            <div>
                <button type="button" onClick={addGroup} className={ui.btnAdd}>
                    + Add skill group
                </button>
            </div>
        </div>
    );
}
