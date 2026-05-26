"use client";

import type { TextBlockSectionData } from "@/lib/frontPageDefaults";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import ParagraphFieldsEditor from "@/components/admin/ParagraphFieldsEditor";
import {
    homeBodyClass,
    homeBodyStyle,
    homeCardClass,
    homeH2Class,
    homeHeadingStyle,
} from "@/components/home/homeSectionStyles";

export function TextBlockSectionView({ data }: { data: TextBlockSectionData }) {
    return (
        <section className={homeCardClass}>
            <h2 className={homeH2Class} style={homeHeadingStyle}>
                {data.heading}
            </h2>
            <div className={`mt-4 space-y-4 text-[1.05rem] leading-relaxed ${homeBodyClass}`} style={homeBodyStyle}>
                {data.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                ))}
            </div>
        </section>
    );
}

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
