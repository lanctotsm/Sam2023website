import { getSetting } from "@/services/settings";
import { parseNavStyles } from "@/lib/frontPageDefaults";
import { fontFamilyValue } from "@/lib/fonts";

/**
 * Reject any color value that isn't a plain hex, rgb(), rgba(), hsl(), or hsla()
 * before injecting it into a <style> tag.
 */
function safeColor(val: string): string | null {
    return /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d\s,.%/]+\)$|^hsla?\([\d\s,.%/]+\)$/.test(val.trim())
        ? val.trim()
        : null;
}

/**
 * NavStyleProvider injects custom nav CSS variables via a <style> block so that
 * both :root (light) and .dark selectors work correctly — inline `style` attributes
 * cannot respond to Tailwind's .dark class, so a stylesheet approach is required.
 *
 * Fonts use self-hosted next/font CSS variables (see lib/siteFonts.ts), matching
 * page styles — no runtime Google Fonts <link>.
 */
export default async function NavStyleProvider({ children }: { children: React.ReactNode }) {
    const raw = await getSetting("nav_styles");
    const style = parseNavStyles(raw);

    const lightLines: string[] = [];
    const darkLines: string[] = [];

    const bgColor = safeColor(style.bgColor);
    const bgColorDark = safeColor(style.bgColorDark);
    const textColor = safeColor(style.textColor);
    const textColorDark = safeColor(style.textColorDark);
    const accentColor = safeColor(style.accentColor);
    const accentColorDark = safeColor(style.accentColorDark);

    if (bgColor) lightLines.push(`--nav-bg: ${bgColor};`);
    if (textColor) lightLines.push(`--nav-text: ${textColor};`);
    if (accentColor) lightLines.push(`--nav-accent: ${accentColor};`);

    const navFont = fontFamilyValue(style.font);
    if (navFont) {
        lightLines.push(`--nav-font: ${navFont};`);
    }

    if (bgColorDark) darkLines.push(`--nav-bg: ${bgColorDark};`);
    if (textColorDark) darkLines.push(`--nav-text: ${textColorDark};`);
    if (accentColorDark) darkLines.push(`--nav-accent: ${accentColorDark};`);

    const styleBlocks: string[] = [];
    if (lightLines.length > 0) styleBlocks.push(`:root { ${lightLines.join(" ")} }`);
    if (darkLines.length > 0) styleBlocks.push(`.dark { ${darkLines.join(" ")} }`);

    return (
        <>
            {styleBlocks.length > 0 && (
                <style dangerouslySetInnerHTML={{ __html: styleBlocks.join("\n") }} />
            )}
            {children}
        </>
    );
}
