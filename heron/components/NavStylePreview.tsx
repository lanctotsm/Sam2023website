"use client";

import type { NavStyleConfig } from "@/lib/frontPageDefaults";
import { AVAILABLE_FONTS, buildGoogleFontsUrl, type AvailableFont } from "@/lib/fonts";

type Props = {
    value: NavStyleConfig;
};

/**
 * Small mockup of the top navigation bar styled with the pending, unsaved
 * nav style values, so an admin can see the effect of a color/font change
 * before saving. Mirrors the light/dark variable fallbacks used by the real
 * <Navigation /> component and NavStyleProvider.
 */
export default function NavStylePreview({ value }: Props) {
    const fontValid = value.font && AVAILABLE_FONTS.includes(value.font as AvailableFont);
    const fontUrl = fontValid ? buildGoogleFontsUrl([value.font]) : null;

    const navStyle = (bg: string, text: string, accent: string, font: string): React.CSSProperties => ({
        backgroundColor: bg || "color-mix(in srgb, var(--color-chestnut-light) 88%, transparent)",
        color: text || "var(--color-desert-tan)",
        fontFamily: font ? `"${font}", sans-serif` : "inherit",
        ["--nav-accent" as string]: accent || text || "var(--color-desert-tan)",
    });

    return (
        <div className="rounded-lg border border-desert-tan-dark/40 bg-white/60 p-4 dark:border-dark-muted/40 dark:bg-dark-bg/60">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-olive dark:text-dark-muted">
                Live Preview — Navigation
            </p>

            {fontUrl && (
                // eslint-disable-next-line @next/next/no-page-custom-font
                <link rel="stylesheet" href={fontUrl} />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                {/* Light */}
                <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-desert-tan-dark px-3 py-2.5 text-sm"
                    style={navStyle(value.bgColor, value.textColor, value.accentColor, fontValid ? value.font : "")}
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
                        value.accentColorDark || value.accentColor,
                        fontValid ? value.font : ""
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
