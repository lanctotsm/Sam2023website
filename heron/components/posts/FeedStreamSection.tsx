import { formatPostDate } from "@/lib/format-post-date";
import type { FeedItem } from "@/lib/feeds/types";
import { sanitizePublicHttpUrl } from "@/lib/feeds/urlSafety";

type Props = {
    title: string;
    items: FeedItem[];
    error?: string | null;
};

export default function FeedStreamSection({ title, items, error }: Props) {
    return (
        <section className="grid gap-4">
            <h2
                className="heading-rule m-0 text-xl font-bold text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]"
                style={{ fontFamily: "var(--page-heading-font, var(--font-display))" }}
            >
                {title}
            </h2>
            {error ? (
                <div className="rounded-xl border border-copper bg-copper/5 p-4 text-center text-copper dark:border-copper/50">
                    [Feed unavailable: {title}]
                </div>
            ) : items.length === 0 ? (
                <div className="surface-card text-center">
                    <p
                        className="m-0 text-[var(--page-body-color,var(--color-olive-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]"
                        style={{ fontFamily: "var(--page-body-font, inherit)" }}
                    >
                        No items in this feed yet.
                    </p>
                </div>
            ) : (
                <div
                    className="max-h-[28rem] overflow-y-auto overscroll-contain rounded-xl border border-desert-tan-dark/60 dark:border-dark-muted/60"
                    tabIndex={0}
                    aria-label={`${title} feed items`}
                >
                    <ul className="divide-y divide-desert-tan-dark/40 dark:divide-dark-muted/40">
                        {items.map((item, index) => {
                            const href = sanitizePublicHttpUrl(item.url);
                            const imageUrl = sanitizePublicHttpUrl(item.imageUrl);
                            return (
                                <li key={`${item.url}-${index}`}>
                                    <article className="surface-card m-0 rounded-none border-0 border-b border-desert-tan-dark/30 shadow-none last:border-b-0 dark:border-dark-muted/30">
                                        <div className="flex gap-4">
                                            {imageUrl ? (
                                                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-desert-tan/30 dark:bg-dark-muted/30">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imageUrl}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                </div>
                                            ) : null}
                                            <div className="min-w-0 flex-1">
                                                {item.publishedAt ? (
                                                    <time
                                                        dateTime={item.publishedAt}
                                                        className="mb-2 inline-block rounded-full bg-desert-tan/50 px-2.5 py-0.5 text-xs font-medium text-chestnut-dark dark:bg-dark-muted/40 dark:text-dark-text"
                                                    >
                                                        {formatPostDate(item.publishedAt)}
                                                    </time>
                                                ) : null}
                                                <h3
                                                    className="text-base font-semibold leading-snug text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]"
                                                    style={{
                                                        fontFamily:
                                                            "var(--page-heading-font, var(--font-display))",
                                                    }}
                                                >
                                                    {item.title}
                                                </h3>
                                                {item.excerpt ? (
                                                    <p
                                                        className="mt-2 line-clamp-2 text-[0.95rem] leading-relaxed text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]"
                                                        style={{
                                                            fontFamily: "var(--page-body-font, inherit)",
                                                        }}
                                                    >
                                                        {item.excerpt}
                                                    </p>
                                                ) : null}
                                                {href ? (
                                                    <a
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-3 inline-flex min-h-[44px] items-center font-medium text-[var(--page-link-color,var(--color-copper))] transition-colors hover:opacity-80 dark:text-[var(--page-link-color-dark,var(--color-caramel-light))]"
                                                    >
                                                        View source →
                                                    </a>
                                                ) : null}
                                            </div>
                                        </div>
                                    </article>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </section>
    );
}
