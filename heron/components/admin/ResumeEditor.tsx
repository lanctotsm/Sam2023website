"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { ResumeDocument, Profile } from "@/lib/resume/types";
import type { ResumePdfResult } from "@/services/resumePdf";
import { createDefaultResume, isStandardSectionId } from "@/lib/resume/defaults";
import { importResumeJson } from "@/lib/resume/import";
import { RESUME_SECTION_REGISTRY } from "@/components/resume/resumeSectionRegistry";
import { CustomSectionEditor } from "@/components/resume/sections/CustomSection";
import ResumeSectionOrderPanel from "@/components/admin/ResumeSectionOrderPanel";
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
  adminBtnAdd as btnAdd,
  adminBtnDanger as btnDanger,
  adminCompactInputClass as inputClass,
  adminCompactLabelClass as labelClass,
  adminSectionClass as sectionClass
} from "@/lib/admin-ui";

const textareaClass = `${inputClass} min-h-[80px] resize-y`;
const btnPrimary =
    "rounded-lg bg-chestnut px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-chestnut-dark disabled:cursor-not-allowed disabled:opacity-60 dark:bg-caramel dark:text-dark-bg dark:hover:bg-caramel-light";

const ui: AdminUi = { labelClass, inputClass, textareaClass, btnAdd, btnDanger };

type PdfStatusLine = { tone: "ok" | "error" | "muted"; text: string };

function BasicsEditor({
    doc,
    setDoc
}: {
    doc: ResumeDocument;
    setDoc: React.Dispatch<React.SetStateAction<ResumeDocument>>;
}) {
    const updateBasics = (patch: Partial<ResumeDocument["basics"]>) => {
        setDoc((d) => ({ ...d, basics: { ...d.basics, ...patch } }));
    };

    const updateProfile = (index: number, patch: Partial<Profile>) => {
        setDoc((d) => ({
            ...d,
            basics: {
                ...d.basics,
                profiles: d.basics.profiles.map((profile, i) =>
                    i === index ? { ...profile, ...patch } : profile
                )
            }
        }));
    };

    return (
        <section className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Basics</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Name" value={doc.basics.name} ui={ui} onChange={(v) => updateBasics({ name: v })} />
                <TextField label="Title" value={doc.basics.label} ui={ui} placeholder="Senior Software Engineer" onChange={(v) => updateBasics({ label: v })} />
                <TextField label="Email" value={doc.basics.email} ui={ui} onChange={(v) => updateBasics({ email: v })} />
                <TextField
                    label="Phone"
                    value={doc.basics.phone}
                    ui={ui}
                    hint="Leave blank to omit it everywhere. If filled in, it is published on a public page where scrapers can harvest it, which tends to attract spam calls."
                    onChange={(v) => updateBasics({ phone: v })}
                />
                <TextField label="Website" value={doc.basics.url} ui={ui} placeholder="https://" onChange={(v) => updateBasics({ url: v })} />
                <div className="grid grid-cols-2 gap-3">
                    <TextField label="City" value={doc.basics.location.city} ui={ui} onChange={(v) => setDoc((d) => ({ ...d, basics: { ...d.basics, location: { ...d.basics.location, city: v } } }))} />
                    <TextField label="Region" value={doc.basics.location.region} ui={ui} placeholder="MD" onChange={(v) => setDoc((d) => ({ ...d, basics: { ...d.basics, location: { ...d.basics.location, region: v } } }))} />
                </div>
            </div>
            <div className="mt-3">
                <TextAreaField label="Summary" value={doc.basics.summary} ui={ui} hint="Intro paragraph shown under the header" onChange={(v) => updateBasics({ summary: v })} />
            </div>
            <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-chestnut-dark dark:text-dark-text">Profiles</h3>
                <div className="grid gap-3">
                    {doc.basics.profiles.map((profile, index) => (
                        <div key={profile.id} className={entryCardClass}>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <TextField label="Network" value={profile.network} ui={ui} placeholder="GitHub" onChange={(v) => updateProfile(index, { network: v })} />
                                <TextField label="Username" value={profile.username} ui={ui} onChange={(v) => updateProfile(index, { username: v })} />
                                <TextField label="URL" value={profile.url} ui={ui} placeholder="https://" onChange={(v) => updateProfile(index, { url: v })} />
                            </div>
                            <div className="mt-3 flex justify-end">
                                <EntryControls
                                    index={index}
                                    count={doc.basics.profiles.length}
                                    ui={ui}
                                    onMove={(direction) =>
                                        setDoc((d) => ({
                                            ...d,
                                            basics: { ...d.basics, profiles: moveItem(d.basics.profiles, index, direction) }
                                        }))
                                    }
                                    onRemove={() =>
                                        setDoc((d) => ({
                                            ...d,
                                            basics: {
                                                ...d.basics,
                                                profiles: d.basics.profiles.filter((p) => p.id !== profile.id)
                                            }
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    ))}
                    <div>
                        <button
                            type="button"
                            className={btnAdd}
                            onClick={() =>
                                setDoc((d) => ({
                                    ...d,
                                    basics: {
                                        ...d.basics,
                                        profiles: [
                                            ...d.basics.profiles,
                                            { id: generateEntryId(), network: "", username: "", url: "" }
                                        ]
                                    }
                                }))
                            }
                        >
                            + Add profile
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function ResumeEditor() {
    const [doc, setDoc] = useState<ResumeDocument>(createDefaultResume());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [pdfStatus, setPdfStatus] = useState<PdfStatusLine | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<ResumeDocument>("/resume", { cache: "no-store" });
                setDoc(data);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to load resume");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const reportPdf = (pdf: ResumePdfResult) => {
        if (pdf.status === "ok") {
            toast.success("PDF updated");
            setPdfStatus({
                tone: "ok",
                text: `PDF generated ${new Date(pdf.generatedAt).toLocaleString()}`
            });
        } else if (pdf.status === "unavailable") {
            setPdfStatus({ tone: "muted", text: pdf.error });
        } else {
            toast.error("PDF render failed");
            setPdfStatus({ tone: "error", text: `PDF render failed: ${pdf.error}` });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = await apiFetch<{ resume: ResumeDocument; pdf: ResumePdfResult }>(
                "/resume",
                { method: "PUT", body: JSON.stringify(doc) }
            );
            setDoc(data.resume);
            toast.success("Resume saved");
            reportPdf(data.pdf);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save resume");
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        try {
            const data = await apiFetch<{ pdf: ResumePdfResult }>("/resume/pdf/regenerate", {
                method: "POST"
            });
            reportPdf(data.pdf);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to regenerate PDF");
        } finally {
            setRegenerating(false);
        }
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        const text = await file.text();
        const result = importResumeJson(text);
        if (!result.ok) {
            toast.error(result.error);
            return;
        }
        setDoc(result.document);
        toast.success("Imported into the editor. Save to publish.");
    };

    if (loading) {
        return <p className="text-olive-dark dark:text-dark-muted">Loading resume…</p>;
    }

    const customById = new Map(doc.meta.heron.customSections.map((s) => [s.id, s]));

    return (
        <div className="grid gap-4">
            <header className={sectionClass}>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="m-0 mr-auto text-xl font-semibold text-chestnut dark:text-dark-text">
                        Resume
                    </h1>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={handleImportFile}
                    />
                    <button
                        type="button"
                        className={btnAdd}
                        onClick={() => importInputRef.current?.click()}
                    >
                        Import JSON
                    </button>
                    <a href="/api/resume/export" className={btnAdd} download>
                        Export JSON
                    </a>
                    <a href="/api/resume/pdf" className={btnAdd} target="_blank" rel="noopener noreferrer">
                        Download PDF
                    </a>
                    <button type="button" onClick={handleRegenerate} disabled={regenerating} className={btnAdd}>
                        {regenerating ? "Regenerating…" : "Regenerate PDF"}
                    </button>
                    <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
                {pdfStatus && (
                    <p
                        className={`mb-0 mt-2 text-sm ${
                            pdfStatus.tone === "error"
                                ? "text-red-700 dark:text-red-300"
                                : pdfStatus.tone === "ok"
                                  ? "text-olive-dark dark:text-dark-muted"
                                  : "text-olive dark:text-dark-muted"
                        }`}
                    >
                        {pdfStatus.text}
                    </p>
                )}
            </header>

            <BasicsEditor doc={doc} setDoc={setDoc} />

            <ResumeSectionOrderPanel doc={doc} setDoc={setDoc} sectionClass={sectionClass} ui={ui} />

            {doc.meta.heron.sectionOrder.map((id) => {
                if (isStandardSectionId(id)) {
                    const def = RESUME_SECTION_REGISTRY[id];
                    const Editor = def.Editor;
                    return (
                        <section key={id} className={sectionClass}>
                            <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">
                                {def.label}
                            </h2>
                            <Editor doc={doc} setDoc={setDoc} ui={ui} />
                        </section>
                    );
                }

                const custom = customById.get(id);
                if (!custom) return null;
                return (
                    <section key={id} className={sectionClass}>
                        <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">
                            {custom.heading || "Custom section"}
                        </h2>
                        <CustomSectionEditor
                            section={custom}
                            ui={ui}
                            onChange={(next) =>
                                setDoc((d) => ({
                                    ...d,
                                    meta: {
                                        ...d.meta,
                                        heron: {
                                            ...d.meta.heron,
                                            customSections: d.meta.heron.customSections.map((s) =>
                                                s.id === next.id ? next : s
                                            )
                                        }
                                    }
                                }))
                            }
                        />
                    </section>
                );
            })}

            <div className="flex justify-end">
                <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
                    {saving ? "Saving…" : "Save"}
                </button>
            </div>
        </div>
    );
}
