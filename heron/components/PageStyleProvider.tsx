import { getSetting } from "@/services/settings";
import { parsePageStyles } from "@/lib/frontPageDefaults";
import { buildGoogleFontsUrl } from "@/lib/fonts";
import { buildPageBgStyle, buildPageCssVars } from "@/lib/pageStyleVars";

type PageKey = "home" | "albums" | "posts" | "resume";

type Props = {
    page: PageKey;
    children?: React.ReactNode;
};

export default async function PageStyleProvider({ page, children }: Props) {
    const raw = await getSetting("page_styles");
    const styles = parsePageStyles(raw);
    const { background, style } = styles[page];

    const cssVars = buildPageCssVars(style);
    const hasCssVars = Object.keys(cssVars).length > 0;

    // Collect font names for Google Fonts link
    const fonts: string[] = [];
    if (style.headingFont) fonts.push(style.headingFont);
    if (style.bodyFont) fonts.push(style.bodyFont);
    const fontUrl = buildGoogleFontsUrl(fonts);

    const hasBg = background.backgroundType !== "none";
    const bgStyles = hasBg ? buildPageBgStyle(background, { attachment: "fixed" }) : {};
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
