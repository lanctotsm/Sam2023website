import type { HomeSectionTemplateData } from "@/lib/frontPageDefaults";

export type SectionEditorUi = {
    sectionClass: string;
    labelClass: string;
    inputClass: string;
    textareaClass: string;
    btnDanger: string;
    btnAdd: string;
};

export type SectionEditorProps<T extends HomeSectionTemplateData> = {
    sectionId: string;
    data: T;
    onChange: (patch: Partial<T>) => void;
    ui: SectionEditorUi;
    showToast?: (message: string, type: "success" | "error") => void;
    uploadBackgroundImage?: (file: File) => Promise<string>;
};
