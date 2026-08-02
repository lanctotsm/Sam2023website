"use client";

import type { PageStyleEntry } from "@/lib/frontPageDefaults";
import { buildGoogleFontsUrl } from "@/lib/fonts";
import { buildPageBgStyle, buildPageCssVars } from "@/lib/pageStyleVars";

type Props = {
    label: string;
    value: PageStyleEntry;
};

const headingClass =
    "heading-rule m-0 font-bold text-[var(--page-h1-color,var(--color-chestnut))] dark:text-[var(--page-h1-color-dark,var(--color-dark-text))]";
const subheadingClass =
    "mt-3 text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]";
const bodyClass =
    "mt-2 text-sm leading-relaxed text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-text))]";
const cardBodyClass =
    "text-sm leading-relaxed text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-text))]";
const linkClass =
    "mt-2 inline-block text-sm font-medium text-[var(--page-link-color,var(--color-copper))] dark:text-[var(--page-link-color-dark,var(--color-caramel-light))]";
const headingStyle = { fontFamily: "var(--page-heading-font, var(--font-display))" };
const bodyStyle = { fontFamily: "var(--page-body-font, inherit)" };

/**
 * Renders a small, self-contained mockup (heading, subheading, body copy,
 * link, and card) styled exactly the way the real site would render them for
 * this page — but driven by the *pending, unsaved* form values instead of
 * the saved settings. This lets an admin see what a color/font change will
 * look like before committing it. Light and dark variants are shown side by
 * side using a locally-scoped `.dark` wrapper, so it never touches the
 * actual site theme.
 */
export default function PageStylePreview({ label, value }: Props) {
    const { style, background } = value;

    const cssVars = buildPageCssVars(style);
    const bgStyles = background.backgroundType !== "none" ? buildPageBgStyle(background) : {};

    const fonts: string[] = [];
    if (style.headingFont) fonts.push(style.headingFont);
    if (style.bodyFont) fonts.push(style.bodyFont);
    const fontUrl = buildGoogleFontsUrl(fonts);

    return (
        <div className="rounded-lg border border-desert-tan-dark/40 bg-white/60 p-4 dark:border-dark-muted/40 dark:bg-dark-bg/60">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-olive dark:text-dark-muted">
                Live Preview — {label}
            </p>

            {fontUrl && (
                // eslint-disable-next-line @next/next/no-page-custom-font
                <link rel="stylesheet" href={fontUrl} />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                {/* Light mode mockup */}
                <div
                    className="relative overflow-hidden rounded-lg border border-desert-tan-dark bg-canvas p-4"
                    style={{ ...cssVars, ...bgStyles }}
                >
                    <span className="mb-2 inline-block rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-chestnut-dark">
                        Light
                    </span>
                    <h3 className={headingClass} style={headingStyle}>
                        Sample Heading
                    </h3>
                    <h4 className={subheadingClass} style={headingStyle}>
                        Section subheading
                    </h4>
                    <p className={bodyClass} style={bodyStyle}>
                        The quick brown fox jumps over the lazy dog. This is how body text will look.
                    </p>
                    <a href="#" className={linkClass} onClick={(e) => e.preventDefault()}>
                        Sample link →
                    </a>
                    <div className="surface-card mt-3">
                        <p className={cardBodyClass} style={bodyStyle}>
                            Card content preview
                        </p>
                    </div>
                </div>

                {/* Dark mode mockup */}
                <div
                    className="dark relative overflow-hidden rounded-lg border border-dark-muted bg-dark-canvas p-4"
                    style={{ ...cssVars, ...bgStyles }}
                >
                    <span className="mb-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-dark-text">
                        Dark
                    </span>
                    <h3 className={headingClass} style={headingStyle}>
                        Sample Heading
                    </h3>
                    <h4 className={subheadingClass} style={headingStyle}>
                        Section subheading
                    </h4>
                    <p className={bodyClass} style={bodyStyle}>
                        The quick brown fox jumps over the lazy dog. This is how body text will look.
                    </p>
                    <a href="#" className={linkClass} onClick={(e) => e.preventDefault()}>
                        Sample link →
                    </a>
                    <div className="surface-card mt-3">
                        <p className={cardBodyClass} style={bodyStyle}>
                            Card content preview
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
