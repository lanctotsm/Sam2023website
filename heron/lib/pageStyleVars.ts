import type { CSSProperties } from "react";
import type { PageBackgroundConfig, PageStyleConfig } from "@/lib/frontPageDefaults";
import { fontFamilyValue } from "@/lib/fonts";

/**
 * Pure, framework-agnostic helpers for turning a PageStyleConfig /
 * PageBackgroundConfig into inline CSS. Shared by the server-rendered
 * PageStyleProvider (applies saved settings site-wide) and the client-side
 * live preview in the admin Settings page (applies pending, unsaved edits
 * scoped to a small mockup).
 */
export function buildPageBgStyle(
    cfg: PageBackgroundConfig,
    options?: { attachment?: "fixed" | "scroll" }
): CSSProperties {
    switch (cfg.backgroundType) {
        case "image": {
            const isSafe = /^https?:\/\/|^\//.test(cfg.backgroundImage);
            if (!isSafe) return {};
            return {
                backgroundImage: `url(${cfg.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: options?.attachment || "scroll",
            };
        }
        case "color":
            return cfg.backgroundColor ? { backgroundColor: cfg.backgroundColor } : {};
        case "gradient":
            if (cfg.gradientFrom && cfg.gradientTo) {
                return {
                    background: `linear-gradient(to bottom right, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                };
            }
            return {};
        case "none":
        default:
            return {};
    }
}

export function buildPageCssVars(style: PageStyleConfig): CSSProperties {
    const vars: Record<string, string> = {};
    // Use next/font CSS var references (no quoted family names). Quoted names
    // like `"Playfair Display", sans-serif` break when serialized into an HTML
    // style="..." attribute during SSR, so --page-heading-font never applied
    // and headings fell back to Fraunces (--font-display).
    const headingFont = fontFamilyValue(style.headingFont);
    const bodyFont = fontFamilyValue(style.bodyFont);
    if (headingFont) vars["--page-heading-font"] = headingFont;
    if (bodyFont) vars["--page-body-font"] = bodyFont;
    if (style.h1Color) vars["--page-h1-color"] = style.h1Color;
    if (style.h1ColorDark) vars["--page-h1-color-dark"] = style.h1ColorDark;
    if (style.h2Color) vars["--page-h2-color"] = style.h2Color;
    if (style.h2ColorDark) vars["--page-h2-color-dark"] = style.h2ColorDark;
    if (style.bodyColor) vars["--page-body-color"] = style.bodyColor;
    if (style.bodyColorDark) vars["--page-body-color-dark"] = style.bodyColorDark;
    if (style.linkColor) vars["--page-link-color"] = style.linkColor;
    if (style.linkColorDark) vars["--page-link-color-dark"] = style.linkColorDark;
    if (style.cardBg) vars["--page-card-bg"] = style.cardBg;
    if (style.cardBgDark) vars["--page-card-bg-dark"] = style.cardBgDark;
    if (style.cardBorder) vars["--page-card-border"] = style.cardBorder;
    if (style.cardBorderDark) vars["--page-card-border-dark"] = style.cardBorderDark;
    return vars as CSSProperties;
}
