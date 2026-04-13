import { getSetting } from "@/services/settings";
import { parseNavStyles, type NavStyleConfig } from "@/lib/frontPageDefaults";
import { buildGoogleFontsUrl } from "@/lib/fonts";

export default async function NavStyleProvider({ children }: { children: React.ReactNode }) {
    const raw = await getSetting("nav_styles");
    const style = parseNavStyles(raw);

    const cssVars: React.CSSProperties = {};
    if (style.bgColor) cssVars["--nav-bg" as any] = style.bgColor;
    if (style.bgColorDark) cssVars["--nav-bg-dark" as any] = style.bgColorDark;
    if (style.textColor) cssVars["--nav-text" as any] = style.textColor;
    if (style.textColorDark) cssVars["--nav-text-dark" as any] = style.textColorDark;
    if (style.accentColor) cssVars["--nav-accent" as any] = style.accentColor;
    if (style.accentColorDark) cssVars["--nav-accent-dark" as any] = style.accentColorDark;
    if (style.font) cssVars["--nav-font" as any] = `"${style.font}", sans-serif`;

    const hasCssVars = Object.keys(cssVars).length > 0;
    const fontUrl = style.font ? buildGoogleFontsUrl([style.font]) : null;

    return (
        <>
            {fontUrl && (
                // eslint-disable-next-line @next/next/no-page-custom-font
                <link rel="stylesheet" href={fontUrl} />
            )}
            {hasCssVars ? <div style={cssVars}>{children}</div> : children}
        </>
    );
}
