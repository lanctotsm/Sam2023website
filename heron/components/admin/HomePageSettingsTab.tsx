"use client";

import type { FrontPageSettings, HomeSection, HomeSectionTemplateData } from "@/lib/frontPageDefaults";
import { findSection, getSectionDisplayLabel } from "@/lib/frontPageDefaults";
import { HOME_SECTION_REGISTRY } from "@/components/home/sectionRegistry";
import type { SectionEditorUi } from "@/components/home/sectionEditorTypes";
import HomePageSectionOrderPanel from "@/components/admin/HomePageSectionOrderPanel";

type Props = {
    config: FrontPageSettings;
    setConfig: React.Dispatch<React.SetStateAction<FrontPageSettings>>;
    showToast: (message: string, type: "success" | "error") => void;
    uploadBackgroundImage: (file: File) => Promise<string>;
    sectionClass: string;
    labelClass: string;
    inputClass: string;
    textareaClass: string;
    btnDanger: string;
    btnAdd: string;
};

export default function HomePageSettingsTab({
    config,
    setConfig,
    showToast,
    uploadBackgroundImage,
    sectionClass,
    labelClass,
    inputClass,
    textareaClass,
    btnDanger,
    btnAdd,
}: Props) {
    const editorUi: SectionEditorUi = {
        sectionClass,
        labelClass,
        inputClass,
        textareaClass,
        btnDanger,
        btnAdd,
    };

    const updateSectionData = (id: string, patch: Partial<HomeSectionTemplateData>) => {
        setConfig((c) => ({
            ...c,
            sections: c.sections.map((s) =>
                s.id === id ? { ...s, data: { ...s.data, ...patch } as HomeSectionTemplateData } : s
            ),
        }));
    };

    const deleteSection = (id: string) => {
        setConfig((c) => ({
            ...c,
            sections: c.sections.filter((s) => s.id !== id),
            sectionOrder: c.sectionOrder.filter((k) => k !== id),
        }));
    };

    const renderSectionEditor = (id: string) => {
        const section = findSection(config, id);
        if (!section) return null;

        const entry = HOME_SECTION_REGISTRY[section.templateId];
        if (!entry) return null;

        const Editor = entry.Editor;
        const title = getSectionDisplayLabel(section);

        return (
            <section key={id} className={sectionClass}>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-chestnut dark:text-dark-text">{title}</h2>
                        <p className="text-xs text-olive-dark dark:text-dark-muted">
                            Template: {entry.label} — {entry.description}
                        </p>
                    </div>
                    {section.removable && (
                        <button type="button" onClick={() => deleteSection(id)} className={btnDanger}>
                            Delete section
                        </button>
                    )}
                </div>
                <Editor
                    sectionId={id}
                    data={section.data}
                    onChange={(patch) => updateSectionData(id, patch)}
                    ui={editorUi}
                    showToast={showToast}
                    uploadBackgroundImage={uploadBackgroundImage}
                />
            </section>
        );
    };

    return (
        <>
            <HomePageSectionOrderPanel
                config={config}
                setConfig={setConfig}
                sectionClass={sectionClass}
                inputClass={inputClass}
                btnAdd={btnAdd}
                btnDanger={btnDanger}
            />
            {config.sectionOrder.map((id) => renderSectionEditor(id))}
        </>
    );
}
