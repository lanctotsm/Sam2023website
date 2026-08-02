"use client";

import type { NavStyleConfig } from "@/lib/frontPageDefaults";
import { fontFamilyValue, isAvailableFont } from "@/lib/fonts";

type Props = {
    value: NavStyleConfig;
};

/**
 * Small mockup of the top navigation bar styled with the pending, unsaved
 * nav style values, so an admin can see the effect of a color/font change
 * before saving. Mirrors the light/dark variable fallbacks used by the real
 * <Navigation /> component and NavStyleProvider.
 *
 * Fonts come from self-hosted next/font CSS variables on <body> — no Google
 * Fonts <link> needed for the preview to match production.
 */
export default function NavStylePreview({ value }: Props) {
    const fontCss = isAvailableFont(value.font) ? fontFamilyValue(value.font) : null;

    const navStyle = (bg: string, text: string, accent: string): React.CSSProperties => ({
        backgroundColor: bg || "color-mix(in srgb, var(--color-chestnut-light) 88%, transparent)",
        color: text || "var(--color-desert-tan)",
        fontFamily: fontCss || "inherit",
        ["--nav-accent" as string]: accent || text || "var(--color-desert-tan)",
    });

    return (
        <div className="rounded-lg border border-desert-tan-dark/40 bg-white/60 p-4 dark:border-dark-muted/40 dark:bg-dark-bg/60">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-olive dark:text-dark-muted">
                Live Preview — Navigation
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
                {/* Light */}
                <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-desert-tan-dark px-3 py-2.5 text-sm"
                    style={navStyle(value.bgColor, value.textColor, value.accentColor)}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="font-semibold" style={{ color: "var(--nav-accent)" }}>About</span>
                        <span className="hidden sm:inline">Resume</span>
                        <span className="hidden sm:inline">Posts</span>
                    </div>
                    <span className="rounded-full border border-current/50 px-2 py-1 text-xs">Sign in</span>
                </div>

                {/* Dark */}
                <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-dark-muted px-3 py-2.5 text-sm"
                    style={navStyle(
                        value.bgColorDark || value.bgColor,
                        value.textColorDark || value.textColor,
                        value.accentColorDark || value.accentColor
                    )}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="font-semibold" style={{ color: "var(--nav-accent)" }}>About</span>
                        <span className="hidden sm:inline">Resume</span>
                        <span className="hidden sm:inline">Posts</span>
                    </div>
                    <span className="rounded-full border border-current/50 px-2 py-1 text-xs">Sign in</span>
                </div>
            </div>
        </div>
    );
}
