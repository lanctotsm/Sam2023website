"use client";

import type { PageStyleConfig } from "@/lib/frontPageDefaults";
import type { PostsPageSectionData, PostsPageSettings } from "@/lib/postsPage";
import { findPostsPageSection, getPostsPageSectionDisplayLabel } from "@/lib/postsPage";
import { getPostsPageRegistryEntry } from "@/components/posts/sectionRegistry";
import type { SectionEditorUi } from "@/components/home/sectionEditorTypes";
import { homeHeadingStyle } from "@/components/home/homeSectionStyles";
import PostsPageSectionOrderPanel from "@/components/admin/PostsPageSectionOrderPanel";
import { buildPageCssVars } from "@/lib/pageStyleVars";
import { DEFAULT_POSTS_LIST_SECTION_ID } from "@/lib/postsPage";

type Props = {
    config: PostsPageSettings;
    setConfig: React.Dispatch<React.SetStateAction<PostsPageSettings>>;
    postsPageStyle: PageStyleConfig;
    showToast: (message: string, type: "success" | "error") => void;
    uploadBackgroundImage: (file: File) => Promise<string>;
    sectionClass: string;
    labelClass: string;
    inputClass: string;
    textareaClass: string;
    btnDanger: string;
    btnAdd: string;
};

export default function PostsPageSettingsTab({
    config,
    setConfig,
    postsPageStyle,
    showToast,
    uploadBackgroundImage,
    sectionClass,
    labelClass,
    inputClass,
    textareaClass,
    btnDanger,
    btnAdd,
}: Props) {
    const editorUi: SectionEditorUi = {
        sectionClass,
        labelClass,
        inputClass,
        textareaClass,
        btnDanger,
        btnAdd,
    };

    const updateSectionData = (id: string, patch: Partial<PostsPageSectionData>) => {
        setConfig((c) => ({
            ...c,
            sections: c.sections.map((s) =>
                s.id === id ? { ...s, data: { ...s.data, ...patch } as PostsPageSectionData } : s
            ),
        }));
    };

    const deleteSection = (id: string) => {
        if (id === DEFAULT_POSTS_LIST_SECTION_ID) return;
        setConfig((c) => ({
            ...c,
            sections: c.sections.filter((s) => s.id !== id),
            sectionOrder: c.sectionOrder.filter((k) => k !== id),
        }));
    };

    const renderSectionEditor = (id: string) => {
        const section = findPostsPageSection(config, id);
        if (!section) return null;

        const entry = getPostsPageRegistryEntry(section.templateId);
        if (!entry) return null;

        const Editor = entry.Editor;
        const title = getPostsPageSectionDisplayLabel(section);
        const canDelete = section.removable && section.templateId !== "posts-list";

        return (
            <section key={id} className={sectionClass}>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2
                            className="text-lg font-semibold text-chestnut dark:text-dark-text"
                            style={homeHeadingStyle}
                        >
                            {title}
                        </h2>
                        <p className="text-xs text-olive-dark dark:text-dark-muted">
                            Template: {entry.label} — {entry.description}
                        </p>
                    </div>
                    {canDelete && (
                        <button type="button" onClick={() => deleteSection(id)} className={btnDanger}>
                            Delete section
                        </button>
                    )}
                </div>
                <Editor
                    sectionId={id}
                    data={section.data}
                    onChange={(patch) => updateSectionData(id, patch)}
                    ui={editorUi}
                    showToast={showToast}
                    uploadBackgroundImage={uploadBackgroundImage}
                />
            </section>
        );
    };

    const cssVars = buildPageCssVars(postsPageStyle);

    return (
        <div style={cssVars} className="grid gap-6">
            <section className={sectionClass}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p
                            id="settings-show-posts-label"
                            className="m-0 text-sm font-semibold text-chestnut-dark dark:text-dark-text"
                        >
                            Show blog posts
                        </p>
                        <p
                            id="settings-show-posts-help"
                            className="mt-1 m-0 text-xs text-olive dark:text-dark-muted"
                        >
                            When off, the Posts page hides the blog grid. Your posts stay in the database and Admin →
                            Posts still works.
                        </p>
                    </div>
                    <button
                        id="settings-show-posts"
                        type="button"
                        role="switch"
                        aria-checked={config.showPosts}
                        aria-labelledby="settings-show-posts-label"
                        aria-describedby="settings-show-posts-help"
                        onClick={() => setConfig((c) => ({ ...c, showPosts: !c.showPosts }))}
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                            config.showPosts
                                ? "bg-chestnut dark:bg-caramel"
                                : "bg-desert-tan-dark dark:bg-dark-muted"
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                                config.showPosts ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>
            </section>

            <PostsPageSectionOrderPanel
                config={config}
                setConfig={setConfig}
                sectionClass={sectionClass}
                inputClass={inputClass}
                btnAdd={btnAdd}
                btnDanger={btnDanger}
            />

            {config.sectionOrder.map((id) => renderSectionEditor(id))}
        </div>
    );
}
