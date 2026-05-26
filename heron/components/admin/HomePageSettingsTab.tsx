"use client";

import type {
    FrontPageSettings,
    HomeSection,
    HeroSectionData,
    TextBlockSectionData,
    CardsSectionData,
    InterestsSectionData,
    ContactSectionData,
    CardItem,
    InterestItem,
    ContactLink,
} from "@/lib/frontPageDefaults";
import { findSection, getSectionDisplayLabel } from "@/lib/frontPageDefaults";
import IconPicker from "@/components/IconPicker";
import LucideIcon from "@/components/LucideIcon";
import HomePageSectionOrderPanel from "@/components/admin/HomePageSectionOrderPanel";
import ParagraphFieldsEditor from "@/components/admin/ParagraphFieldsEditor";

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
    const updateSection = (id: string, updater: (section: HomeSection) => HomeSection) => {
        setConfig((c) => ({
            ...c,
            sections: c.sections.map((s) => (s.id === id ? updater(s) : s)),
        }));
    };

    const updateSectionData = <T extends HomeSection["type"]>(
        id: string,
        patch: Partial<Extract<HomeSection, { type: T }>["data"]>
    ) => {
        updateSection(id, (s) => ({ ...s, data: { ...s.data, ...patch } } as HomeSection));
    };

    const deleteSection = (id: string) => {
        setConfig((c) => ({
            ...c,
            sections: c.sections.filter((s) => s.id !== id),
            sectionOrder: c.sectionOrder.filter((k) => k !== id),
        }));
    };

    const paragraphEditorProps = {
        labelClass,
        textareaClass,
        btnDanger,
        btnAdd,
    };

    const renderSectionEditor = (id: string) => {
        const section = findSection(config, id);
        if (!section) return null;

        const title = getSectionDisplayLabel(section);
        const header = (
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-chestnut dark:text-dark-text">{title}</h2>
                {section.removable && (
                    <button type="button" onClick={() => deleteSection(id)} className={btnDanger}>
                        Delete section
                    </button>
                )}
            </div>
        );

        switch (section.type) {
            case "textBlock": {
                const data = section.data;
                return (
                    <section key={id} className={sectionClass}>
                        {header}
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Section Heading</label>
                                <input
                                    className={inputClass}
                                    value={data.heading}
                                    onChange={(e) =>
                                        updateSectionData(id, { heading: e.target.value } as Partial<TextBlockSectionData>)
                                    }
                                />
                            </div>
                            <ParagraphFieldsEditor
                                paragraphs={data.paragraphs}
                                onChange={(paragraphs) =>
                                    updateSectionData(id, { paragraphs } as Partial<TextBlockSectionData>)
                                }
                                {...paragraphEditorProps}
                            />
                        </div>
                    </section>
                );
            }
            case "hero": {
                const data = section.data;
                return (
                    <section key={id} className={sectionClass}>
                        {header}
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Title</label>
                                <input
                                    className={inputClass}
                                    value={data.title}
                                    onChange={(e) =>
                                        updateSectionData(id, { title: e.target.value } as Partial<HeroSectionData>)
                                    }
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Subtitle</label>
                                <textarea
                                    className={textareaClass}
                                    value={data.subtitle}
                                    onChange={(e) =>
                                        updateSectionData(id, { subtitle: e.target.value } as Partial<HeroSectionData>)
                                    }
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hero Background Type</label>
                                <select
                                    className={inputClass}
                                    value={data.backgroundType}
                                    onChange={(e) =>
                                        updateSectionData(id, {
                                            backgroundType: e.target.value as HeroSectionData["backgroundType"],
                                        })
                                    }
                                >
                                    <option value="gradient">Theme gradient (default)</option>
                                    <option value="color">Solid color</option>
                                    <option value="image">Background image</option>
                                </select>
                            </div>
                            {data.backgroundType === "color" && (
                                <div>
                                    <label className={labelClass}>Background Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={data.backgroundColor || "#6B2D2D"}
                                            onChange={(e) =>
                                                updateSectionData(id, {
                                                    backgroundColor: e.target.value,
                                                } as Partial<HeroSectionData>)
                                            }
                                            className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark"
                                        />
                                        <input
                                            className={inputClass}
                                            value={data.backgroundColor}
                                            onChange={(e) =>
                                                updateSectionData(id, {
                                                    backgroundColor: e.target.value,
                                                } as Partial<HeroSectionData>)
                                            }
                                            placeholder="#6B2D2D"
                                        />
                                    </div>
                                </div>
                            )}
                            {data.backgroundType === "gradient" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>Gradient From</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={data.gradientFrom || "#6B2D2D"}
                                                onChange={(e) =>
                                                    updateSectionData(id, {
                                                        gradientFrom: e.target.value,
                                                    } as Partial<HeroSectionData>)
                                                }
                                                className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark"
                                            />
                                            <input
                                                className={inputClass}
                                                value={data.gradientFrom}
                                                onChange={(e) =>
                                                    updateSectionData(id, {
                                                        gradientFrom: e.target.value,
                                                    } as Partial<HeroSectionData>)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Gradient To</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={data.gradientTo || "#8B4D4D"}
                                                onChange={(e) =>
                                                    updateSectionData(id, {
                                                        gradientTo: e.target.value,
                                                    } as Partial<HeroSectionData>)
                                                }
                                                className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark"
                                            />
                                            <input
                                                className={inputClass}
                                                value={data.gradientTo}
                                                onChange={(e) =>
                                                    updateSectionData(id, {
                                                        gradientTo: e.target.value,
                                                    } as Partial<HeroSectionData>)
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {data.backgroundType === "image" && (
                                <div>
                                    <label className={labelClass}>Hero Background Image</label>
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            id={`hero-bg-${id}`}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                showToast("Uploading...", "success");
                                                try {
                                                    const url = await uploadBackgroundImage(file);
                                                    updateSectionData(id, {
                                                        backgroundImage: url,
                                                    } as Partial<HeroSectionData>);
                                                    showToast("Image uploaded!", "success");
                                                } catch {
                                                    showToast("Upload failed", "error");
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById(`hero-bg-${id}`)?.click()}
                                            className={btnAdd}
                                        >
                                            Select Image
                                        </button>
                                        <input
                                            className={inputClass}
                                            value={data.backgroundImage}
                                            onChange={(e) =>
                                                updateSectionData(id, {
                                                    backgroundImage: e.target.value,
                                                } as Partial<HeroSectionData>)
                                            }
                                            placeholder="https://…"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                );
            }
            case "cards": {
                const data = section.data;
                const updateCardItem = (index: number, patch: Partial<CardItem>) =>
                    updateSectionData(id, {
                        items: data.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
                    } as Partial<CardsSectionData>);
                const addCardItem = () =>
                    updateSectionData(id, {
                        items: [...data.items, { icon: "Star", title: "", text: "" }],
                    } as Partial<CardsSectionData>);
                const removeCardItem = (index: number) =>
                    updateSectionData(id, {
                        items: data.items.filter((_, i) => i !== index),
                    } as Partial<CardsSectionData>);

                return (
                    <section key={id} className={sectionClass}>
                        {header}
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Section Heading</label>
                                <input
                                    className={inputClass}
                                    value={data.heading}
                                    onChange={(e) =>
                                        updateSectionData(id, { heading: e.target.value } as Partial<CardsSectionData>)
                                    }
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Columns ({data.columns})</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={4}
                                    value={data.columns}
                                    onChange={(e) =>
                                        updateSectionData(id, {
                                            columns: Number(e.target.value),
                                        } as Partial<CardsSectionData>)
                                    }
                                    className="w-full accent-chestnut dark:accent-caramel"
                                />
                            </div>
                            {data.items.map((item, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg border border-desert-tan-dark/50 bg-white/50 p-4 dark:border-dark-muted/50 dark:bg-dark-bg/50"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-medium text-chestnut-dark dark:text-dark-text">
                                            Card {i + 1}
                                        </span>
                                        <button type="button" onClick={() => removeCardItem(i)} className={btnDanger}>
                                            Remove
                                        </button>
                                    </div>
                                    <div className="grid gap-3">
                                        <IconPicker
                                            value={item.icon}
                                            onChange={(icon) => updateCardItem(i, { icon })}
                                        />
                                        <input
                                            className={inputClass}
                                            value={item.title}
                                            onChange={(e) => updateCardItem(i, { title: e.target.value })}
                                            placeholder="Title"
                                        />
                                        <textarea
                                            className={textareaClass}
                                            value={item.text}
                                            onChange={(e) => updateCardItem(i, { text: e.target.value })}
                                            placeholder="Description"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addCardItem} className={btnAdd}>
                                + Add Card
                            </button>
                        </div>
                    </section>
                );
            }
            case "interests": {
                const data = section.data;
                const updateInterestItem = (index: number, patch: Partial<InterestItem>) =>
                    updateSectionData(id, {
                        items: data.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
                    } as Partial<InterestsSectionData>);
                const addInterestItem = () =>
                    updateSectionData(id, {
                        items: [...data.items, { icon: "Star", label: "" }],
                    } as Partial<InterestsSectionData>);
                const removeInterestItem = (index: number) =>
                    updateSectionData(id, {
                        items: data.items.filter((_, i) => i !== index),
                    } as Partial<InterestsSectionData>);

                return (
                    <section key={id} className={sectionClass}>
                        {header}
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Section Heading</label>
                                <input
                                    className={inputClass}
                                    value={data.heading}
                                    onChange={(e) =>
                                        updateSectionData(id, {
                                            heading: e.target.value,
                                        } as Partial<InterestsSectionData>)
                                    }
                                />
                            </div>
                            {data.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <IconPicker
                                        value={item.icon}
                                        onChange={(icon) => updateInterestItem(i, { icon })}
                                    />
                                    <input
                                        className={inputClass}
                                        value={item.label}
                                        onChange={(e) => updateInterestItem(i, { label: e.target.value })}
                                        placeholder="Label"
                                    />
                                    <button type="button" onClick={() => removeInterestItem(i)} className={btnDanger}>
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addInterestItem} className={btnAdd}>
                                + Add Interest
                            </button>
                        </div>
                    </section>
                );
            }
            case "contact": {
                const data = section.data;
                const updateContactLink = (index: number, patch: Partial<ContactLink>) =>
                    updateSectionData(id, {
                        links: data.links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
                    } as Partial<ContactSectionData>);
                const addContactLink = () =>
                    updateSectionData(id, {
                        links: [...data.links, { icon: "Link", label: "", url: "" }],
                    } as Partial<ContactSectionData>);
                const removeContactLink = (index: number) =>
                    updateSectionData(id, {
                        links: data.links.filter((_, i) => i !== index),
                    } as Partial<ContactSectionData>);

                return (
                    <section key={id} className={sectionClass}>
                        {header}
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Section Heading</label>
                                <input
                                    className={inputClass}
                                    value={data.heading}
                                    onChange={(e) =>
                                        updateSectionData(id, {
                                            heading: e.target.value,
                                        } as Partial<ContactSectionData>)
                                    }
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Description Text</label>
                                <textarea
                                    className={textareaClass}
                                    value={data.text}
                                    onChange={(e) =>
                                        updateSectionData(id, { text: e.target.value } as Partial<ContactSectionData>)
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-chestnut-dark dark:text-dark-text">
                                    Show Social Links
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateSectionData(id, {
                                            showSocials: !data.showSocials,
                                        } as Partial<ContactSectionData>)
                                    }
                                    className={`relative h-6 w-11 rounded-full transition-colors ${data.showSocials ? "bg-chestnut dark:bg-caramel" : "bg-desert-tan-dark dark:bg-dark-muted"}`}
                                >
                                    <span
                                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.showSocials ? "left-[22px]" : "left-0.5"}`}
                                    />
                                </button>
                            </div>
                            {data.showSocials &&
                                data.links.map((link, i) => (
                                    <div
                                        key={i}
                                        className="rounded-lg border border-desert-tan-dark/50 bg-white/50 p-4 dark:border-dark-muted/50 dark:bg-dark-bg/50"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <LucideIcon name={link.icon} size={18} />
                                            <button
                                                type="button"
                                                onClick={() => removeContactLink(i)}
                                                className={btnDanger}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="grid gap-3">
                                            <IconPicker
                                                value={link.icon}
                                                onChange={(icon) => updateContactLink(i, { icon })}
                                            />
                                            <input
                                                className={inputClass}
                                                value={link.label}
                                                onChange={(e) => updateContactLink(i, { label: e.target.value })}
                                            />
                                            <input
                                                className={inputClass}
                                                value={link.url}
                                                onChange={(e) => updateContactLink(i, { url: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            {data.showSocials && (
                                <button type="button" onClick={addContactLink} className={btnAdd}>
                                    + Add Link
                                </button>
                            )}
                        </div>
                    </section>
                );
            }
            default:
                return null;
        }
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
