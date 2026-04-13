import { getSetting } from "@/services/settings";
import {
    parsePageStyles,
    type PageBackgroundConfig,
    type PageStyleConfig,
} from "@/lib/frontPageDefaults";
import { buildGoogleFontsUrl } from "@/lib/fonts";

type PageKey = "home" | "albums" | "posts" | "resume";

type Props = {
    page: PageKey;
    children?: React.ReactNode;
};

function bgStyle(cfg: PageBackgroundConfig): React.CSSProperties {
    switch (cfg.backgroundType) {
        case "image": {
            const isSafe = /^https?:\/\/|^\//.test(cfg.backgroundImage);
            if (!isSafe) return {};
            return {
                backgroundImage: `url(${cfg.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
            };
        }
        case "color":
            return { backgroundColor: cfg.backgroundColor };
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

function buildCssVars(style: PageStyleConfig): React.CSSProperties {
    const vars: Record<string, string> = {};
    if (style.headingFont) vars["--page-heading-font"] = `"${style.headingFont}", sans-serif`;
    if (style.bodyFont) vars["--page-body-font"] = `"${style.bodyFont}", sans-serif`;
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
    return vars as React.CSSProperties;
}

export default async function PageStyleProvider({ page, children }: Props) {
    const raw = await getSetting("page_styles");
    const styles = parsePageStyles(raw);
    const { background, style } = styles[page];

    const cssVars = buildCssVars(style);
    const hasCssVars = Object.keys(cssVars).length > 0;

    // Collect font names for Google Fonts link
    const fonts: string[] = [];
    if (style.headingFont) fonts.push(style.headingFont);
    if (style.bodyFont) fonts.push(style.bodyFont);
    const fontUrl = buildGoogleFontsUrl(fonts);

    const hasBg = background.backgroundType !== "none";
    const bgStyles = hasBg ? bgStyle(background) : {};
    const hasBgStyles = Object.keys(bgStyles).length > 0;

    return (
        <>
            {/* Google Fonts link */}
            {fontUrl && (
                // eslint-disable-next-line @next/next/no-page-custom-font
                <link rel="stylesheet" href={fontUrl} />
            )}
            {/* Fixed background */}
            {hasBgStyles && (
                <div className="fixed inset-0 -z-10" style={bgStyles} />
            )}
            {/* CSS custom properties wrapper (or just children if no vars) */}
            {hasCssVars ? (
                <div style={cssVars}>{children}</div>
            ) : (
                children
            )}
        </>
    );
}
