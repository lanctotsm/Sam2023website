import type { CSSProperties } from "react";
import { safeColor, safeCssUrl } from "@/lib/css-values";
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
            const imageUrl = safeCssUrl(cfg.backgroundImage);
            if (!imageUrl) return {};
            return {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: options?.attachment || "scroll",
            };
        }
        case "color": {
            const backgroundColor = cfg.backgroundColor ? safeColor(cfg.backgroundColor) : null;
            return backgroundColor ? { backgroundColor } : {};
        }
        case "gradient": {
            const gradientFrom = cfg.gradientFrom ? safeColor(cfg.gradientFrom) : null;
            const gradientTo = cfg.gradientTo ? safeColor(cfg.gradientTo) : null;
            if (gradientFrom && gradientTo) {
                return {
                    background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
                };
            }
            return {};
        }
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
    assignColor(vars, "--page-h1-color", style.h1Color);
    assignColor(vars, "--page-h1-color-dark", style.h1ColorDark);
    assignColor(vars, "--page-h2-color", style.h2Color);
    assignColor(vars, "--page-h2-color-dark", style.h2ColorDark);
    assignColor(vars, "--page-body-color", style.bodyColor);
    assignColor(vars, "--page-body-color-dark", style.bodyColorDark);
    assignColor(vars, "--page-link-color", style.linkColor);
    assignColor(vars, "--page-link-color-dark", style.linkColorDark);
    assignColor(vars, "--page-card-bg", style.cardBg);
    assignColor(vars, "--page-card-bg-dark", style.cardBgDark);
    assignColor(vars, "--page-card-border", style.cardBorder);
    assignColor(vars, "--page-card-border-dark", style.cardBorderDark);
    return vars as CSSProperties;
}

function assignColor(vars: Record<string, string>, name: string, value: string): void {
    if (!value) return;
    const color = safeColor(value);
    if (color) vars[name] = color;
}
