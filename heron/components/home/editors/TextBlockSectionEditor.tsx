"use client";

import type { TextBlockSectionData } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import ParagraphFieldsEditor from "@/components/admin/ParagraphFieldsEditor";

export function TextBlockSectionEditor({ data, onChange, ui }: SectionEditorProps<TextBlockSectionData>) {
    const { labelClass, inputClass, textareaClass, btnDanger, btnAdd } = ui;
    return (
        <div className="grid gap-4">
            <div>
                <label className={labelClass}>Section heading</label>
                <input
                    className={inputClass}
                    value={data.heading}
                    onChange={(e) => onChange({ heading: e.target.value })}
                />
            </div>
            <ParagraphFieldsEditor
                paragraphs={data.paragraphs}
                onChange={(paragraphs) => onChange({ paragraphs })}
                labelClass={labelClass}
                textareaClass={textareaClass}
                btnDanger={btnDanger}
                btnAdd={btnAdd}
            />
        </div>
    );
}
