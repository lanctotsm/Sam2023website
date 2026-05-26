"use client";

import type {
    FrontPageSettings,
    BuiltinTextBlockId,
    CustomSection,
    TextBlockSettings,
} from "@/lib/frontPageDefaults";
import {
    BUILT_IN_SECTION_LABELS,
    customSectionKey,
    isBuiltinTextBlockId,
    parseCustomSectionKey,
} from "@/lib/frontPageDefaults";
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
    const updateHero = (patch: Partial<FrontPageSettings["hero"]>) =>
        setConfig((c) => ({ ...c, hero: { ...c.hero, ...patch } }));
    const updateTextBlock = (id: BuiltinTextBlockId, patch: Partial<TextBlockSettings>) =>
        setConfig((c) => ({ ...c, [id]: { ...c[id], ...patch } }));
    const updateCards = (patch: Partial<FrontPageSettings["cards"]>) =>
        setConfig((c) => ({ ...c, cards: { ...c.cards, ...patch } }));
    const updateInterests = (patch: Partial<FrontPageSettings["interests"]>) =>
        setConfig((c) => ({ ...c, interests: { ...c.interests, ...patch } }));
    const updateContact = (patch: Partial<FrontPageSettings["contact"]>) =>
        setConfig((c) => ({ ...c, contact: { ...c.contact, ...patch } }));

    const updateCustomSection = (id: string, patch: Partial<CustomSection>) =>
        setConfig((c) => ({
            ...c,
            customSections: c.customSections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));

    const removeCustomSection = (id: string) => {
        const key = customSectionKey(id);
        setConfig((c) => ({
            ...c,
            customSections: c.customSections.filter((s) => s.id !== id),
            sectionOrder: c.sectionOrder.filter((k) => k !== key),
        }));
    };

    const paragraphEditorProps = {
        labelClass,
        textareaClass,
        btnDanger,
        btnAdd,
    };

    const renderBuiltinTextBlockEditor = (id: BuiltinTextBlockId) => {
        const block = config[id];
        return (
            <section key={id} className={sectionClass}>
                <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">
                    {BUILT_IN_SECTION_LABELS[id]}
                </h2>
                <div className="grid gap-4">
                    <div>
                        <label className={labelClass}>Section Heading</label>
                        <input
                            className={inputClass}
                            value={block.heading}
                            onChange={(e) => updateTextBlock(id, { heading: e.target.value })}
                        />
                    </div>
                    <ParagraphFieldsEditor
                        paragraphs={block.paragraphs}
                        onChange={(paragraphs) => updateTextBlock(id, { paragraphs })}
                        {...paragraphEditorProps}
                    />
                </div>
            </section>
        );
    };

    const updateCardItem = (index: number, patch: Partial<FrontPageSettings["cards"]["items"][0]>) =>
        setConfig((c) => ({
            ...c,
            cards: {
                ...c.cards,
                items: c.cards.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
            },
        }));
    const addCardItem = () =>
        setConfig((c) => ({
            ...c,
            cards: { ...c.cards, items: [...c.cards.items, { icon: "Star", title: "", text: "" }] },
        }));
    const removeCardItem = (index: number) =>
        setConfig((c) => ({
            ...c,
            cards: { ...c.cards, items: c.cards.items.filter((_, i) => i !== index) },
        }));

    const updateInterestItem = (index: number, patch: Partial<FrontPageSettings["interests"]["items"][0]>) =>
        setConfig((c) => ({
            ...c,
            interests: {
                ...c.interests,
                items: c.interests.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
            },
        }));
    const addInterestItem = () =>
        setConfig((c) => ({
            ...c,
            interests: { ...c.interests, items: [...c.interests.items, { icon: "Star", label: "" }] },
        }));
    const removeInterestItem = (index: number) =>
        setConfig((c) => ({
            ...c,
            interests: { ...c.interests, items: c.interests.items.filter((_, i) => i !== index) },
        }));

    const updateContactLink = (index: number, patch: Partial<FrontPageSettings["contact"]["links"][0]>) =>
        setConfig((c) => ({
            ...c,
            contact: {
                ...c.contact,
                links: c.contact.links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
            },
        }));
    const addContactLink = () =>
        setConfig((c) => ({
            ...c,
            contact: {
                ...c.contact,
                links: [...c.contact.links, { icon: "Link", label: "", url: "" }],
            },
        }));
    const removeContactLink = (index: number) =>
        setConfig((c) => ({
            ...c,
            contact: { ...c.contact, links: c.contact.links.filter((_, i) => i !== index) },
        }));

    const renderSectionEditor = (key: string) => {
        if (isBuiltinTextBlockId(key)) {
            return renderBuiltinTextBlockEditor(key);
        }

        const customId = parseCustomSectionKey(key);
        if (customId) {
            const section = config.customSections.find((s) => s.id === customId);
            if (!section) return null;
            return (
                <section key={key} className={sectionClass}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-chestnut dark:text-dark-text">
                            Custom: {section.heading || "Untitled"}
                        </h2>
                        <button type="button" onClick={() => removeCustomSection(customId)} className={btnDanger}>
                            Delete section
                        </button>
                    </div>
                    <div className="grid gap-4">
                        <div>
                            <label className={labelClass}>Section Heading</label>
                            <input
                                className={inputClass}
                                value={section.heading}
                                onChange={(e) => updateCustomSection(customId, { heading: e.target.value })}
                            />
                        </div>
                        <ParagraphFieldsEditor
                            paragraphs={section.paragraphs}
                            onChange={(paragraphs) => updateCustomSection(customId, { paragraphs })}
                            {...paragraphEditorProps}
                        />
                    </div>
                </section>
            );
        }

        switch (key) {
            case "hero":
                return (
                    <section key="hero" className={sectionClass}>
                        <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Hero</h2>
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Title</label>
                                <input
                                    className={inputClass}
                                    value={config.hero.title}
                                    onChange={(e) => updateHero({ title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Subtitle</label>
                                <textarea
                                    className={textareaClass}
                                    value={config.hero.subtitle}
                                    onChange={(e) => updateHero({ subtitle: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hero Background Type</label>
                                <select
                                    className={inputClass}
                                    value={config.hero.backgroundType}
                                    onChange={(e) =>
                                        updateHero({
                                            backgroundType: e.target.value as "gradient" | "color" | "image",
                                        })
                                    }
                                >
                                    <option value="gradient">Theme gradient (default)</option>
                                    <option value="color">Solid color</option>
                                    <option value="image">Background image</option>
                                </select>
                            </div>
                            {config.hero.backgroundType === "color" && (
                                <div>
                                    <label className={labelClass}>Background Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={config.hero.backgroundColor || "#6B2D2D"}
                                            onChange={(e) => updateHero({ backgroundColor: e.target.value })}
                                            className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark"
                                        />
                                        <input
                                            className={inputClass}
                                            value={config.hero.backgroundColor}
                                            onChange={(e) => updateHero({ backgroundColor: e.target.value })}
                                            placeholder="#6B2D2D"
                                        />
                                    </div>
                                </div>
                            )}
                            {config.hero.backgroundType === "gradient" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>Gradient From</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={config.hero.gradientFrom || "#6B2D2D"}
                                                onChange={(e) => updateHero({ gradientFrom: e.target.value })}
                                                className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark"
                                            />
                                            <input
                                                className={inputClass}
                                                value={config.hero.gradientFrom}
                                                onChange={(e) => updateHero({ gradientFrom: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Gradient To</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={config.hero.gradientTo || "#8B4D4D"}
                                                onChange={(e) => updateHero({ gradientTo: e.target.value })}
                                                className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark"
                                            />
                                            <input
                                                className={inputClass}
                                                value={config.hero.gradientTo}
                                                onChange={(e) => updateHero({ gradientTo: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {config.hero.backgroundType === "image" && (
                                <div>
                                    <label className={labelClass}>Hero Background Image</label>
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            id="hero-bg-image-upload"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                showToast("Uploading...", "success");
                                                try {
                                                    const url = await uploadBackgroundImage(file);
                                                    updateHero({ backgroundImage: url });
                                                    showToast("Image uploaded!", "success");
                                                } catch {
                                                    showToast("Upload failed", "error");
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById("hero-bg-image-upload")?.click()}
                                            className={btnAdd}
                                        >
                                            Select Image
                                        </button>
                                        <input
                                            className={inputClass}
                                            value={config.hero.backgroundImage}
                                            onChange={(e) => updateHero({ backgroundImage: e.target.value })}
                                            placeholder="https://…"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                );
            case "cards":
                return (
                    <section key="cards" className={sectionClass}>
                        <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Cards</h2>
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Section Heading</label>
                                <input
                                    className={inputClass}
                                    value={config.cards.heading}
                                    onChange={(e) => updateCards({ heading: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Columns ({config.cards.columns})</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={4}
                                    value={config.cards.columns}
                                    onChange={(e) => updateCards({ columns: Number(e.target.value) })}
                                    className="w-full accent-chestnut dark:accent-caramel"
                                />
                            </div>
                            {config.cards.items.map((item, i) => (
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
                                        <IconPicker value={item.icon} onChange={(icon) => updateCardItem(i, { icon })} />
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
            case "interests":
                return (
                    <section key="interests" className={sectionClass}>
                        <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Interests</h2>
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Section Heading</label>
                                <input
                                    className={inputClass}
                                    value={config.interests.heading}
                                    onChange={(e) => updateInterests({ heading: e.target.value })}
                                />
                            </div>
                            {config.interests.items.map((item, i) => (
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
            case "contact":
                return (
                    <section key="contact" className={sectionClass}>
                        <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Contact</h2>
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Section Heading</label>
                                <input
                                    className={inputClass}
                                    value={config.contact.heading}
                                    onChange={(e) => updateContact({ heading: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Description Text</label>
                                <textarea
                                    className={textareaClass}
                                    value={config.contact.text}
                                    onChange={(e) => updateContact({ text: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-chestnut-dark dark:text-dark-text">
                                    Show Social Links
                                </label>
                                <button
                                    type="button"
                                    onClick={() => updateContact({ showSocials: !config.contact.showSocials })}
                                    className={`relative h-6 w-11 rounded-full transition-colors ${config.contact.showSocials ? "bg-chestnut dark:bg-caramel" : "bg-desert-tan-dark dark:bg-dark-muted"}`}
                                >
                                    <span
                                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.contact.showSocials ? "left-[22px]" : "left-0.5"}`}
                                    />
                                </button>
                            </div>
                            {config.contact.showSocials &&
                                config.contact.links.map((link, i) => (
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
                            {config.contact.showSocials && (
                                <button type="button" onClick={addContactLink} className={btnAdd}>
                                    + Add Link
                                </button>
                            )}
                        </div>
                    </section>
                );
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
            {config.sectionOrder.map((key) => renderSectionEditor(key))}
        </>
    );
}
