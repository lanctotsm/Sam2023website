"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useDialog } from "@/components/ui/DialogProvider";
import { describeLiveTemplate } from "@/lib/siteTemplates/compare";
import { getSiteTemplatePresets } from "@/lib/siteTemplates/presets";
import { savedTemplateKey, type SavedSiteTemplate, type SiteTemplateSnapshot } from "@/lib/siteTemplates/types";

type Props = {
    frontPage: SiteTemplateSnapshot["front_page"];
    pageStyles: SiteTemplateSnapshot["page_styles"];
    navStyles: SiteTemplateSnapshot["nav_styles"];
    activeTemplate: string;
    savedTemplates: SavedSiteTemplate[];
    onApplied: (snapshot: SiteTemplateSnapshot, templateId: string) => void;
    onSavedTemplates: (templates: SavedSiteTemplate[]) => void;
    showToast: (message: string, type: "success" | "error") => void;
};

const applyClass =
    "rounded-lg bg-chestnut px-4 py-2 text-sm font-semibold text-desert-tan transition hover:bg-chestnut-light disabled:opacity-50 dark:bg-caramel dark:text-chestnut-dark";
const secondaryClass =
    "rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-sm font-semibold text-chestnut transition hover:bg-desert-tan disabled:opacity-50 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text";

export default function TemplatesTab({
    frontPage,
    pageStyles,
    navStyles,
    activeTemplate,
    savedTemplates,
    onApplied,
    onSavedTemplates,
    showToast,
}: Props) {
    const router = useRouter();
    const { confirm } = useDialog();
    const [busy, setBusy] = useState(false);
    const [saveName, setSaveName] = useState("");
    const presets = getSiteTemplatePresets();
    const live: SiteTemplateSnapshot = { front_page: frontPage, page_styles: pageStyles, nav_styles: navStyles };
    const status = describeLiveTemplate(activeTemplate, live, presets, savedTemplates);

    async function applySnapshot(templateId: string, name: string, snapshot: SiteTemplateSnapshot) {
        const ok = await confirm({
            title: `Apply ${name}?`,
            message: "This replaces the homepage, page styles, and navigation styles. You can keep editing them afterward.",
            confirmLabel: "Apply template",
            cancelLabel: "Cancel",
        });
        if (!ok) return;

        setBusy(true);
        try {
            const next = structuredClone(snapshot);
            await apiFetch("/settings", {
                method: "PUT",
                body: JSON.stringify({
                    settings: {
                        front_page: JSON.stringify(next.front_page),
                        page_styles: JSON.stringify(next.page_styles),
                        nav_styles: JSON.stringify(next.nav_styles),
                        active_template: templateId,
                    },
                }),
            });
            onApplied(next, templateId);
            showToast(`${name} is now the live site.`, "success");
            router.refresh();
        } catch {
            showToast(`Could not apply ${name}`, "error");
        } finally {
            setBusy(false);
        }
    }

    async function saveCurrent() {
        const name = saveName.trim();
        if (!name) {
            showToast("Name the setup before saving it.", "error");
            return;
        }
        setBusy(true);
        try {
            await apiFetch("/site-templates", {
                method: "POST",
                body: JSON.stringify({ name, snapshot: structuredClone(live) }),
            });
            const listed = await apiFetch<{ templates: SavedSiteTemplate[] }>("/site-templates");
            onSavedTemplates(listed.templates);
            setSaveName("");
            showToast(`Saved "${name}".`, "success");
        } catch {
            showToast("Could not save this setup", "error");
        } finally {
            setBusy(false);
        }
    }

    async function removeSaved(template: SavedSiteTemplate) {
        const ok = await confirm({
            title: `Delete ${template.name}?`,
            message: "This removes the saved setup. The live site stays as it is.",
            confirmLabel: "Delete",
            cancelLabel: "Cancel",
            variant: "danger",
        });
        if (!ok) return;
        setBusy(true);
        try {
            await apiFetch(`/site-templates/${template.id}`, { method: "DELETE" });
            onSavedTemplates(savedTemplates.filter((item) => item.id !== template.id));
            showToast(`Deleted ${template.name}.`, "success");
        } catch {
            showToast("Could not delete that setup", "error");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="space-y-6">
            <div>
                <h2 className="mb-2 text-lg font-semibold text-chestnut dark:text-dark-text">Templates</h2>
                <p id="template-status" className="text-sm text-olive-dark dark:text-dark-muted">
                    {status.edited
                        ? `${status.name} was applied, and the live site has been edited since then.`
                        : status.id
                          ? `${status.name} matches the live site.`
                          : "Custom setup. Apply a template to replace the homepage, page styles, and navigation together."}
                </p>
            </div>

            <div className="grid gap-4">
                {presets.map((preset) => (
                    <article
                        key={preset.id}
                        className="rounded-xl border border-desert-tan-dark bg-white p-4 dark:border-dark-muted dark:bg-dark-bg"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="mb-2 flex gap-1" aria-hidden="true">
                                    {preset.swatch.map((color) => (
                                        <span
                                            key={color}
                                            className="h-5 w-5 rounded-full border border-black/10"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <h3 className="text-base font-semibold text-chestnut dark:text-dark-text">{preset.name}</h3>
                                <p className="mt-1 max-w-prose text-sm text-olive dark:text-dark-muted">{preset.description}</p>
                            </div>
                            <button
                                id={`template-apply-${preset.id}`}
                                type="button"
                                className={applyClass}
                                disabled={busy}
                                onClick={() => applySnapshot(preset.id, preset.name, preset.snapshot)}
                            >
                                Apply
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <div className="rounded-xl border border-desert-tan-dark bg-white p-4 dark:border-dark-muted dark:bg-dark-bg">
                <h3 className="text-base font-semibold text-chestnut dark:text-dark-text">Save current setup</h3>
                <p className="mt-1 text-sm text-olive dark:text-dark-muted">
                    Stores the homepage, page styles, and navigation you have open now. Saving does not change the live site.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <input
                        id="template-save-name"
                        className="min-w-[12rem] flex-1 rounded-lg border border-desert-tan-dark bg-white px-3 py-2 text-sm text-chestnut dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text"
                        value={saveName}
                        onChange={(event) => setSaveName(event.target.value)}
                        placeholder="Name this setup"
                        maxLength={80}
                    />
                    <button id="template-save-btn" type="button" className={secondaryClass} disabled={busy} onClick={saveCurrent}>
                        Save current setup
                    </button>
                </div>
            </div>

            {savedTemplates.length > 0 ? (
                <div className="grid gap-3">
                    <h3 className="text-base font-semibold text-chestnut dark:text-dark-text">Saved setups</h3>
                    {savedTemplates.map((template) => (
                        <article
                            key={template.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-desert-tan-dark bg-white p-4 dark:border-dark-muted dark:bg-dark-bg"
                        >
                            <div>
                                <h4 className="text-sm font-semibold text-chestnut dark:text-dark-text">{template.name}</h4>
                                <p className="text-xs text-olive dark:text-dark-muted">{template.created_at}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className={applyClass}
                                    disabled={busy}
                                    onClick={() =>
                                        applySnapshot(savedTemplateKey(template.id), template.name, template.snapshot)
                                    }
                                >
                                    Apply
                                </button>
                                <button
                                    type="button"
                                    className={secondaryClass}
                                    disabled={busy}
                                    onClick={() => removeSaved(template)}
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
