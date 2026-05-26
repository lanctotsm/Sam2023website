"use client";

type Props = {
    paragraphs: string[];
    onChange: (paragraphs: string[]) => void;
    labelClass: string;
    textareaClass: string;
    btnDanger: string;
    btnAdd: string;
};

/** Shared paragraph list editor for text-block home page sections. */
export default function ParagraphFieldsEditor({
    paragraphs,
    onChange,
    labelClass,
    textareaClass,
    btnDanger,
    btnAdd,
}: Props) {
    return (
        <>
            {paragraphs.map((p, i) => (
                <div key={i} className="relative">
                    <label className={labelClass}>Paragraph {i + 1}</label>
                    <textarea
                        className={textareaClass}
                        value={p}
                        onChange={(e) => {
                            const next = [...paragraphs];
                            next[i] = e.target.value;
                            onChange(next);
                        }}
                    />
                    {paragraphs.length > 1 && (
                        <button
                            type="button"
                            onClick={() => onChange(paragraphs.filter((_, j) => j !== i))}
                            className={`mt-1 ${btnDanger}`}
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={() => onChange([...paragraphs, ""])} className={btnAdd}>
                + Add Paragraph
            </button>
        </>
    );
}
