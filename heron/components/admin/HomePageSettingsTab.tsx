"use client";

import type { FrontPageSettings, BuiltInSectionId, CustomSection } from "@/lib/frontPageDefaults";
import {
    BUILT_IN_SECTION_IDS,
    BUILT_IN_SECTION_LABELS,
    createCustomSection,
    customSectionKey,
    getSectionDisplayLabel,
    parseCustomSectionKey,
} from "@/lib/frontPageDefaults";
import IconPicker from "@/components/IconPicker";
import LucideIcon from "@/components/LucideIcon";

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
    const updateAbout = (patch: Partial<FrontPageSettings["about"]>) =>
        setConfig((c) => ({ ...c, about: { ...c.about, ...patch } }));
    const updateCards = (patch: Partial<FrontPageSettings["cards"]>) =>
        setConfig((c) => ({ ...c, cards: { ...c.cards, ...patch } }));
    const updateJourney = (patch: Partial<FrontPageSettings["journey"]>) =>
        setConfig((c) => ({ ...c, journey: { ...c.journey, ...patch } }));
    const updateInterests = (patch: Partial<FrontPageSettings["interests"]>) =>
        setConfig((c) => ({ ...c, interests: { ...c.interests, ...patch } }));
    const updateContact = (patch: Partial<FrontPageSettings["contact"]>) =>
        setConfig((c) => ({ ...c, contact: { ...c.contact, ...patch } }));

    const updateCustomSection = (id: string, patch: Partial<CustomSection>) =>
        setConfig((c) => ({
            ...c,
            customSections: c.customSections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));

    const setSectionOrder = (order: string[]) => setConfig((c) => ({ ...c, sectionOrder: order }));

    const removeFromPage = (key: string) =>
        setSectionOrder(config.sectionOrder.filter((k) => k !== key));

    const moveSection = (index: number, direction: -1 | 1) => {
        const next = [...config.sectionOrder];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setSectionOrder(next);
    };

    const addBuiltInSection = (id: BuiltInSectionId) => {
        if (config.sectionOrder.includes(id)) return;
        setSectionOrder([...config.sectionOrder, id]);
    };

    const addCustomSection = () => {
        const section = createCustomSection();
        setConfig((c) => ({
            ...c,
            customSections: [...c.customSections, section],
            sectionOrder: [...c.sectionOrder, customSectionKey(section.id)],
        }));
    };

    const removeCustomSection = (id: string) => {
        const key = customSectionKey(id);
        setConfig((c) => ({
            ...c,
            customSections: c.customSections.filter((s) => s.id !== id),
            sectionOrder: c.sectionOrder.filter((k) => k !== key),
        }));
    };

    const availableBuiltIns = BUILT_IN_SECTION_IDS.filter((id) => !config.sectionOrder.includes(id));

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

    const renderParagraphEditor = (
        paragraphs: string[],
        onChange: (paragraphs: string[]) => void
    ) => (
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

    const renderSectionEditor = (key: string) => {
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
                        {renderParagraphEditor(section.paragraphs, (paragraphs) =>
                            updateCustomSection(customId, { paragraphs })
                        )}
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
            case "about":
                return (
                    <section key="about" className={sectionClass}>
                        <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">About</h2>
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Section Heading</label>
                                <input
                                    className={inputClass}
                                    value={config.about.heading}
                                    onChange={(e) => updateAbout({ heading: e.target.value })}
                                />
                            </div>
                            {renderParagraphEditor(config.about.paragraphs, (paragraphs) =>
                                updateAbout({ paragraphs })
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
            case "journey":
                return (
                    <section key="journey" className={sectionClass}>
                        <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Journey</h2>
                        <div className="grid gap-4">
                            <div>
                                <label className={labelClass}>Section Heading</label>
                                <input
                                    className={inputClass}
                                    value={config.journey.heading}
                                    onChange={(e) => updateJourney({ heading: e.target.value })}
                                />
                            </div>
                            {renderParagraphEditor(config.journey.paragraphs, (paragraphs) =>
                                updateJourney({ paragraphs })
                            )}
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
            <section className={sectionClass}>
                <h2 className="mb-2 text-lg font-semibold text-chestnut dark:text-dark-text">Homepage sections</h2>
                <p className="mb-4 text-sm text-olive-dark dark:text-dark-muted">
                    Choose which sections appear on the home page and their order. Removing a section hides it but
                    keeps its content if you add it back later.
                </p>
                {config.sectionOrder.length === 0 ? (
                    <p className="text-sm text-olive dark:text-dark-muted">No sections on the page. Add one below.</p>
                ) : (
                    <ul className="mb-4 space-y-2">
                        {config.sectionOrder.map((key, index) => (
                            <li
                                key={key}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-desert-tan-dark/50 bg-white/60 px-3 py-2 dark:border-dark-muted/50 dark:bg-dark-bg/40"
                            >
                                <span className="min-w-0 flex-1 text-sm font-medium text-chestnut-dark dark:text-dark-text">
                                    {getSectionDisplayLabel(key, config)}
                                </span>
                                <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveSection(index, -1)}
                                    className={btnAdd}
                                    aria-label="Move up"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    disabled={index === config.sectionOrder.length - 1}
                                    onClick={() => moveSection(index, 1)}
                                    className={btnAdd}
                                    aria-label="Move down"
                                >
                                    ↓
                                </button>
                                <button type="button" onClick={() => removeFromPage(key)} className={btnDanger}>
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="flex flex-wrap items-center gap-2">
                    {availableBuiltIns.length > 0 && (
                        <select
                            className={inputClass}
                            defaultValue=""
                            onChange={(e) => {
                                const id = e.target.value as BuiltInSectionId;
                                if (id) {
                                    addBuiltInSection(id);
                                    e.target.value = "";
                                }
                            }}
                        >
                            <option value="" disabled>
                                Add section…
                            </option>
                            {availableBuiltIns.map((id) => (
                                <option key={id} value={id}>
                                    {BUILT_IN_SECTION_LABELS[id]}
                                </option>
                            ))}
                        </select>
                    )}
                    <button type="button" onClick={addCustomSection} className={btnAdd}>
                        + Custom text block
                    </button>
                </div>
            </section>

            {config.sectionOrder.map((key) => renderSectionEditor(key))}
        </>
    );
}
