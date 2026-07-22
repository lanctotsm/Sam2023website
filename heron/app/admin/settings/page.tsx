"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
    defaultFrontPage,
    parseFrontPageConfig,
    parsePageStyles,
    defaultPageStyles,
    type FrontPageSettings,
    type PageStyles,
    type PageStyleEntry,
    type NavStyleConfig,
    parseNavStyles,
    defaultNavStyle,
} from "@/lib/frontPageDefaults";
import PageStyleEditor from "@/components/PageStyleEditor";
import NavStyleEditor from "@/components/NavStyleEditor";
import HomePageSettingsTab from "@/components/admin/HomePageSettingsTab";

type Toast = { message: string; type: "success" | "error" };
type Tab = "general" | "homepage" | "styles";

// ─── Styles ────────────────────────────────────────────────────────────────────
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

// ─── Upload helper ──────────────────────────────────────────────────────────────
async function uploadBackgroundImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/settings/background-image", { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json() as { url: string };
    return data.url;
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("general");

    // General
    const [siteTitle, setSiteTitle] = useState("");
    const [footerText, setFooterText] = useState("");
    const [aiAltTextEnabled, setAiAltTextEnabled] = useState(false);

    // Home page
    const [config, setConfig] = useState<FrontPageSettings>(defaultFrontPage);

    // Page styles (backgrounds + typography + colors)
    const [pageStyles, setPageStyles] = useState<PageStyles>(defaultPageStyles);
    
    // Nav styles
    const [navStyles, setNavStyles] = useState<NavStyleConfig>(defaultNavStyle);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);

    // ── Load ────────────────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<Record<string, string>>(
                    "/settings?keys=site_title,footer_text,front_page,page_styles,nav_styles,ai_alt_text_enabled"
                );
                if (data.site_title) setSiteTitle(data.site_title);
                if (data.footer_text) setFooterText(data.footer_text);
                if (data.ai_alt_text_enabled === "true") setAiAltTextEnabled(true);
                if (data.front_page) setConfig(parseFrontPageConfig(data.front_page));
                if (data.page_styles) setPageStyles(parsePageStyles(data.page_styles));
                if (data.nav_styles) setNavStyles(parseNavStyles(data.nav_styles));
            } catch {
                // settings not saved yet, defaults are fine
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── Toast ───────────────────────────────────────────────────────────────────
    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // ── Save (all tabs at once) ─────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch("/settings", {
                method: "PUT",
                body: JSON.stringify({
                    settings: {
                        site_title: siteTitle,
                        footer_text: footerText,
                        ai_alt_text_enabled: aiAltTextEnabled ? "true" : "false",
                        front_page: JSON.stringify(config),
                        page_styles: JSON.stringify(pageStyles),
                        nav_styles: JSON.stringify(navStyles),
                    },
                }),
            });
            showToast("Settings saved!", "success");
        } catch {
            showToast("Failed to save settings", "error");
        } finally {
            setSaving(false);
        }
    };

    // ── Page styles updater ────────────────────────────────────────────────
    const updatePageStyle = (page: keyof PageStyles, value: PageStyleEntry) =>
        setPageStyles((prev) => ({ ...prev, [page]: value }));

    // ── Loading state ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="py-12 text-center text-olive dark:text-dark-muted">Loading settings…</div>
        );
    }

    // ── Tab button helper ──────────────────────────────────────────────────────
    const tabBtn = (id: Tab, label: string) => (
        <button
            id={`settings-tab-${id}`}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === id
                    ? "bg-chestnut text-desert-tan shadow dark:bg-caramel dark:text-chestnut-dark"
                    : "border border-desert-tan-dark bg-white text-chestnut hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface"
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
                        toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                    }`}
                >
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-chestnut dark:text-dark-text">Admin Settings</h1>
                <button
                    id="settings-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-chestnut px-5 py-2.5 font-semibold text-desert-tan transition-all hover:bg-chestnut-light disabled:opacity-50 dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"
                >
                    {saving ? "Saving…" : "Save All"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {tabBtn("general", "⚙️ General")}
                {tabBtn("homepage", "🏠 Home Page")}
                {tabBtn("styles", "🎨 Page Styles")}
            </div>

            {/* ── Tab: General ─────────────────────────────────────────────── */}
            {activeTab === "general" && (
                <section className={sectionClass}>
                    <h2 className="mb-4 text-lg font-semibold text-chestnut dark:text-dark-text">Global Settings</h2>
                    <div className="grid gap-4">
                        <div>
                            <label className={labelClass}>Site Title</label>
                            <input
                                id="settings-site-title"
                                className={inputClass}
                                value={siteTitle}
                                onChange={(e) => setSiteTitle(e.target.value)}
                                placeholder="My Website"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Footer Text</label>
                            <input
                                id="settings-footer-text"
                                type="text"
                                className={inputClass}
                                value={footerText}
                                onChange={(e) => setFooterText(e.target.value)}
                                placeholder="© 2024 Your Name. All rights reserved."
                            />
                        </div>

                        <div className="flex items-start justify-between gap-4 rounded-lg border border-desert-tan-dark p-3 dark:border-dark-muted">
                            <div>
                                <p className="m-0 text-sm font-semibold text-chestnut-dark dark:text-dark-text">
                                    AI alt text (Bedrock)
                                </p>
                                <p className="mt-1 m-0 text-xs text-olive dark:text-dark-muted">
                                    When on, generate alt text on upload if empty, and allow Generate in Edit Info.
                                    Requires Nova Lite model access in AWS Bedrock.
                                </p>
                            </div>
                            <button
                                id="settings-ai-alt-text"
                                type="button"
                                role="switch"
                                aria-checked={aiAltTextEnabled}
                                onClick={() => setAiAltTextEnabled((v) => !v)}
                                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                                    aiAltTextEnabled
                                        ? "bg-chestnut dark:bg-caramel"
                                        : "bg-desert-tan-dark dark:bg-dark-muted"
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                                        aiAltTextEnabled ? "translate-x-5" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>
                        
                        <NavStyleEditor
                            value={navStyles}
                            onChange={(patch) => setNavStyles((prev) => ({ ...prev, ...patch }))}
                        />
                    </div>
                </section>
            )}

            {/* ── Tab: Home Page ───────────────────────────────────────────── */}
            {activeTab === "homepage" && (
                <HomePageSettingsTab
                    config={config}
                    setConfig={setConfig}
                    showToast={showToast}
                    uploadBackgroundImage={uploadBackgroundImage}
                    sectionClass={sectionClass}
                    labelClass={labelClass}
                    inputClass={inputClass}
                    textareaClass={textareaClass}
                    btnDanger={btnDanger}
                    btnAdd={btnAdd}
                />
            )}


            {/* ── Tab: Page Styles ────────────────────────────────────────── */}
            {activeTab === "styles" && (
                <section className={sectionClass}>
                    <h2 className="mb-2 text-lg font-semibold text-chestnut dark:text-dark-text">Page Styles</h2>
                    <p className="mb-6 text-sm text-olive-dark dark:text-dark-muted">
                        Customize the background, typography, and colors for each section of your site. Content cards will remain opaque and readable. Leave fields blank to use theme defaults.
                    </p>
                    <div className="grid gap-5">
                        <PageStyleEditor
                            label="🏠 Home Page"
                            value={pageStyles.home}
                            onChange={(v) => updatePageStyle("home", v)}
                            onUpload={uploadBackgroundImage}
                            showToast={showToast}
                        />
                        <PageStyleEditor
                            label="📷 Albums"
                            value={pageStyles.albums}
                            onChange={(v) => updatePageStyle("albums", v)}
                            onUpload={uploadBackgroundImage}
                            showToast={showToast}
                        />
                        <PageStyleEditor
                            label="📝 Posts"
                            value={pageStyles.posts}
                            onChange={(v) => updatePageStyle("posts", v)}
                            onUpload={uploadBackgroundImage}
                            showToast={showToast}
                        />
                        <PageStyleEditor
                            label="📄 Resume"
                            value={pageStyles.resume}
                            onChange={(v) => updatePageStyle("resume", v)}
                            onUpload={uploadBackgroundImage}
                            showToast={showToast}
                        />
                    </div>
                </section>
            )}

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
