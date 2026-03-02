"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { defaultFrontPage, parseFrontPageConfig, type FrontPageSettings, type CardItem, type InterestItem, type ContactLink } from "@/lib/frontPageDefaults";
import IconPicker from "@/components/IconPicker";
import LucideIcon from "@/components/LucideIcon";

type Toast = { message: string; type: "success" | "error" };

export default function AdminSettingsPage() {
    const [siteTitle, setSiteTitle] = useState("");
    const [footerText, setFooterText] = useState("");
    const [config, setConfig] = useState<FrontPageSettings>(defaultFrontPage);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);

    // Fetch current settings
    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<Record<string, string>>(
                    "/settings?keys=site_title,footer_text,front_page"
                );
                if (data.site_title) setSiteTitle(data.site_title);
                if (data.footer_text) setFooterText(data.footer_text);
                if (data.front_page) {
                    setConfig(parseFrontPageConfig(data.front_page));
                }
            } catch {
                // settings not saved yet
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch("/settings", {
                method: "PUT",
                body: JSON.stringify({
                    settings: {
                        site_title: siteTitle,
                        footer_text: footerText,
                        front_page: JSON.stringify(config)
                    }
                })
            });
            showToast("Settings saved!", "success");
        } catch {
            showToast("Failed to save settings", "error");
        } finally {
            setSaving(false);
        }
    };

    // Updater helpers
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

    const updateCardItem = (index: number, patch: Partial<CardItem>) =>
        setConfig((c) => ({
            ...c,
            cards: {
                ...c.cards,
                items: c.cards.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
            }
        }));

    const addCardItem = () =>
        setConfig((c) => ({
            ...c,
            cards: { ...c.cards, items: [...c.cards.items, { icon: "Star", title: "", text: "" }] }
        }));

    const removeCardItem = (index: number) =>
        setConfig((c) => ({
            ...c,
            cards: { ...c.cards, items: c.cards.items.filter((_, i) => i !== index) }
        }));

    const updateInterestItem = (index: number, patch: Partial<InterestItem>) =>
        setConfig((c) => ({
            ...c,
            interests: {
                ...c.interests,
                items: c.interests.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
            }
        }));

    const addInterestItem = () =>
        setConfig((c) => ({
            ...c,
            interests: { ...c.interests, items: [...c.interests.items, { icon: "Star", label: "" }] }
        }));

    const removeInterestItem = (index: number) =>
        setConfig((c) => ({
            ...c,
            interests: { ...c.interests, items: c.interests.items.filter((_, i) => i !== index) }
        }));

    const updateContactLink = (index: number, patch: Partial<ContactLink>) =>
        setConfig((c) => ({
            ...c,
            contact: {
                ...c.contact,
                links: c.contact.links.map((link, i) => (i === index ? { ...link, ...patch } : link))
            }
        }));

    const addContactLink = () =>
        setConfig((c) => ({
            ...c,
            contact: {
                ...c.contact,
                links: [...c.contact.links, { icon: "Link", label: "", url: "" }]
            }
        }));

    const removeContactLink = (index: number) =>
        setConfig((c) => ({
            ...c,
            contact: { ...c.contact, links: c.contact.links.filter((_, i) => i !== index) }
        }));

    if (loading) {
        return (
            <div className="py-12 text-center text-olive dark:text-dark-muted">Loading settings…</div>
        );
    }

    const sectionClass =
        "rounded-xl border border-desert-tan-dark bg-surface p-5 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface";
    const labelClass = "block text-sm font-semibold text-chestnut-dark dark:text-dark-text mb-1";
    const inputClass =
        "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2 text-sm outline-none focus:border-chestnut dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:focus:border-caramel";
    const textareaClass = `${inputClass} min-h-[80px] resize-y`;
    const btnDanger =
        "rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50";
    const btnAdd =
        "rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-sm font-medium text-chestnut transition-colors hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface";

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                        }`}
                >
                    {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-chestnut dark:text-dark-text">Site Settings</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-chestnut px-5 py-2.5 font-semibold text-desert-tan transition-all hover:bg-chestnut-light disabled:opacity-50 dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"
                >
                    {saving ? "Saving…" : "Save All"}
                </button>
            </div>

            {/* Global Settings */}
            <section className={sectionClass}>
                <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Global</h2>
                <div className="grid gap-4">
                    <div>
                        <label className={labelClass}>Site Title</label>
                        <input className={inputClass} value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} placeholder="My Website" />
                    </div>
                    <div>
                        <label className={labelClass}>Footer Text</label>
                        <input className={inputClass} value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="© 2024 Your Name. All rights reserved." />
                    </div>
                </div>
            </section>

            {/* Hero */}
            <section className={sectionClass}>
                <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Hero Banner</h2>
                <div className="grid gap-4">
                    <div>
                        <label className={labelClass}>Title</label>
                        <input className={inputClass} value={config.hero.title} onChange={(e) => updateHero({ title: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Subtitle</label>
                        <textarea className={textareaClass} value={config.hero.subtitle} onChange={(e) => updateHero({ subtitle: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Background Type</label>
                        <select
                            className={inputClass}
                            value={config.hero.backgroundType}
                            onChange={(e) => updateHero({ backgroundType: e.target.value as "gradient" | "color" | "image" })}
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
                                <input type="color" value={config.hero.backgroundColor || "#6B2D2D"} onChange={(e) => updateHero({ backgroundColor: e.target.value })} className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark" />
                                <input className={inputClass} value={config.hero.backgroundColor} onChange={(e) => updateHero({ backgroundColor: e.target.value })} placeholder="#6B2D2D" />
                            </div>
                        </div>
                    )}
                    {config.hero.backgroundType === "gradient" && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Gradient From (leave blank for theme default)</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={config.hero.gradientFrom || "#6B2D2D"} onChange={(e) => updateHero({ gradientFrom: e.target.value })} className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark" />
                                    <input className={inputClass} value={config.hero.gradientFrom} onChange={(e) => updateHero({ gradientFrom: e.target.value })} placeholder="" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Gradient To</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={config.hero.gradientTo || "#8B4D4D"} onChange={(e) => updateHero({ gradientTo: e.target.value })} className="h-10 w-14 cursor-pointer rounded border border-desert-tan-dark" />
                                    <input className={inputClass} value={config.hero.gradientTo} onChange={(e) => updateHero({ gradientTo: e.target.value })} placeholder="" />
                                </div>
                            </div>
                        </div>
                    )}
                    {config.hero.backgroundType === "image" && (
                        <div>
                            <label className={labelClass}>Background Image URL</label>
                            <input className={inputClass} value={config.hero.backgroundImage} onChange={(e) => updateHero({ backgroundImage: e.target.value })} placeholder="https://…" />
                        </div>
                    )}
                </div>
            </section>

            {/* About */}
            <section className={sectionClass}>
                <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">About Section</h2>
                <div className="grid gap-4">
                    <div>
                        <label className={labelClass}>Section Heading</label>
                        <input className={inputClass} value={config.about.heading} onChange={(e) => updateAbout({ heading: e.target.value })} />
                    </div>
                    {config.about.paragraphs.map((p, i) => (
                        <div key={i} className="relative">
                            <label className={labelClass}>Paragraph {i + 1}</label>
                            <textarea
                                className={textareaClass}
                                value={p}
                                onChange={(e) => {
                                    const newParagraphs = [...config.about.paragraphs];
                                    newParagraphs[i] = e.target.value;
                                    updateAbout({ paragraphs: newParagraphs });
                                }}
                            />
                            {config.about.paragraphs.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => updateAbout({ paragraphs: config.about.paragraphs.filter((_, j) => j !== i) })}
                                    className={`mt-1 ${btnDanger}`}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => updateAbout({ paragraphs: [...config.about.paragraphs, ""] })} className={btnAdd}>
                        + Add Paragraph
                    </button>
                </div>
            </section>

            {/* Cards */}
            <section className={sectionClass}>
                <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Cards Section</h2>
                <div className="grid gap-4">
                    <div>
                        <label className={labelClass}>Section Heading</label>
                        <input className={inputClass} value={config.cards.heading} onChange={(e) => updateCards({ heading: e.target.value })} />
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
                        <div className="flex justify-between text-xs text-olive dark:text-dark-muted">
                            <span>1</span><span>2</span><span>3</span><span>4</span>
                        </div>
                    </div>
                    {config.cards.items.map((item, i) => (
                        <div key={i} className="rounded-lg border border-desert-tan-dark/50 bg-white/50 p-4 dark:border-dark-muted/50 dark:bg-dark-bg/50">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <LucideIcon name={item.icon} size={20} />
                                    <span className="text-sm font-medium text-chestnut-dark dark:text-dark-text">Card {i + 1}</span>
                                </div>
                                <button type="button" onClick={() => removeCardItem(i)} className={btnDanger}>Remove</button>
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-chestnut-dark dark:text-dark-text">Icon</label>
                                    <IconPicker value={item.icon} onChange={(icon) => updateCardItem(i, { icon })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Title</label>
                                    <input className={inputClass} value={item.title} onChange={(e) => updateCardItem(i, { title: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea className={textareaClass} value={item.text} onChange={(e) => updateCardItem(i, { text: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addCardItem} className={btnAdd}>+ Add Card</button>
                </div>
            </section>

            {/* Journey */}
            <section className={sectionClass}>
                <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Journey Section</h2>
                <div className="grid gap-4">
                    <div>
                        <label className={labelClass}>Section Heading</label>
                        <input className={inputClass} value={config.journey.heading} onChange={(e) => updateJourney({ heading: e.target.value })} />
                    </div>
                    {config.journey.paragraphs.map((p, i) => (
                        <div key={i}>
                            <label className={labelClass}>Paragraph {i + 1}</label>
                            <textarea
                                className={textareaClass}
                                value={p}
                                onChange={(e) => {
                                    const newParagraphs = [...config.journey.paragraphs];
                                    newParagraphs[i] = e.target.value;
                                    updateJourney({ paragraphs: newParagraphs });
                                }}
                            />
                            {config.journey.paragraphs.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => updateJourney({ paragraphs: config.journey.paragraphs.filter((_, j) => j !== i) })}
                                    className={`mt-1 ${btnDanger}`}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => updateJourney({ paragraphs: [...config.journey.paragraphs, ""] })} className={btnAdd}>
                        + Add Paragraph
                    </button>
                </div>
            </section>

            {/* Interests */}
            <section className={sectionClass}>
                <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Interests Section</h2>
                <div className="grid gap-4">
                    <div>
                        <label className={labelClass}>Section Heading</label>
                        <input className={inputClass} value={config.interests.heading} onChange={(e) => updateInterests({ heading: e.target.value })} />
                    </div>
                    {config.interests.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <IconPicker value={item.icon} onChange={(icon) => updateInterestItem(i, { icon })} />
                            <input
                                className={inputClass}
                                value={item.label}
                                onChange={(e) => updateInterestItem(i, { label: e.target.value })}
                                placeholder="Label"
                            />
                            <button type="button" onClick={() => removeInterestItem(i)} className={btnDanger}>×</button>
                        </div>
                    ))}
                    <button type="button" onClick={addInterestItem} className={btnAdd}>+ Add Interest</button>
                </div>
            </section>

            {/* Contact */}
            <section className={sectionClass}>
                <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Contact Section</h2>
                <div className="grid gap-4">
                    <div>
                        <label className={labelClass}>Section Heading</label>
                        <input className={inputClass} value={config.contact.heading} onChange={(e) => updateContact({ heading: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Description Text</label>
                        <textarea className={textareaClass} value={config.contact.text} onChange={(e) => updateContact({ text: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-chestnut-dark dark:text-dark-text">Show Social Links</label>
                        <button
                            type="button"
                            onClick={() => updateContact({ showSocials: !config.contact.showSocials })}
                            className={`relative h-6 w-11 rounded-full transition-colors ${config.contact.showSocials ? "bg-chestnut dark:bg-caramel" : "bg-desert-tan-dark dark:bg-dark-muted"}`}
                        >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.contact.showSocials ? "left-[22px]" : "left-0.5"}`} />
                        </button>
                    </div>
                    {config.contact.showSocials && (
                        <>
                            {config.contact.links.map((link, i) => (
                                <div key={i} className="rounded-lg border border-desert-tan-dark/50 bg-white/50 p-4 dark:border-dark-muted/50 dark:bg-dark-bg/50">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <LucideIcon name={link.icon} size={18} />
                                            <span className="text-sm font-medium text-chestnut-dark dark:text-dark-text">{link.label || `Link ${i + 1}`}</span>
                                        </div>
                                        <button type="button" onClick={() => removeContactLink(i)} className={btnDanger}>Remove</button>
                                    </div>
                                    <div className="grid gap-3">
                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium text-chestnut-dark dark:text-dark-text">Icon</label>
                                            <IconPicker value={link.icon} onChange={(icon) => updateContactLink(i, { icon })} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Label</label>
                                            <input className={inputClass} value={link.label} onChange={(e) => updateContactLink(i, { label: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>URL</label>
                                            <input className={inputClass} value={link.url} onChange={(e) => updateContactLink(i, { url: e.target.value })} placeholder="https://… or mailto:…" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addContactLink} className={btnAdd}>+ Add Link</button>
                        </>
                    )}
                </div>
            </section>

            {/* Bottom save button */}
            <div className="flex justify-end pb-8">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-chestnut px-5 py-2.5 font-semibold text-desert-tan transition-all hover:bg-chestnut-light disabled:opacity-50 dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"
                >
                    {saving ? "Saving…" : "Save All"}
                </button>
            </div>
        </div>
    );
}
