"use client";

import type { RssFeedSectionData } from "@/lib/postsPage";
import type { SectionEditorProps } from "@/components/home/sectionEditorTypes";
import { isAllowedFeedUrl } from "@/lib/feeds/urlSafety";

export function RssFeedSectionView({ data }: { data: RssFeedSectionData }) {
    const title = data.title?.trim() || "RSS feed";
    return (
        <section className="grid gap-4">
            <h2 className="heading-rule m-0 text-xl font-bold text-chestnut dark:text-dark-text">{title}</h2>
            <p className="text-sm text-olive dark:text-dark-muted">Live feed items appear here when configured.</p>
        </section>
    );
}

export function RssFeedSectionEditor({ data, onChange, ui }: SectionEditorProps<RssFeedSectionData>) {
    const { labelClass, inputClass } = ui;
    const feedUrl = data.feedUrl ?? "";
    const urlInvalid = feedUrl.trim().length > 0 && !isAllowedFeedUrl(feedUrl.trim());

    return (
        <div className="grid gap-4">
            <div>
                <label className={labelClass}>Title</label>
                <input
                    className={inputClass}
                    value={data.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                    placeholder="Recent watches"
                />
            </div>
            <div>
                <label className={labelClass}>RSS URL</label>
                <input
                    className={inputClass}
                    type="url"
                    value={feedUrl}
                    onChange={(e) => onChange({ feedUrl: e.target.value })}
                    placeholder="https://letterboxd.com/username/rss/"
                    aria-invalid={urlInvalid}
                    aria-describedby="rss-feed-url-help"
                />
                <p
                    id="rss-feed-url-help"
                    className={`mt-1 m-0 text-xs ${
                        urlInvalid ? "text-red-700 dark:text-red-300" : "text-olive dark:text-dark-muted"
                    }`}
                >
                    {urlInvalid
                        ? "Use a public https:// feed URL. HTTP and private/local addresses are not allowed."
                        : "Public https:// RSS or Atom URL only."}
                </p>
            </div>
        </div>
    );
}
