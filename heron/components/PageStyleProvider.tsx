import { getSetting } from "@/services/settings";
import { parsePageStyles } from "@/lib/frontPageDefaults";
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

    const hasBg = background.backgroundType !== "none";
    const bgStyles = hasBg ? buildPageBgStyle(background, { attachment: "fixed" }) : {};
    const hasBgStyles = Object.keys(bgStyles).length > 0;

    return (
        <>
            {/* Fixed background */}
            {hasBgStyles && (
                <div className="fixed inset-0 -z-10" style={bgStyles} />
            )}
            {/* CSS custom properties wrapper (or just children if no vars).
                Font vars use next/font CSS variable references (no quoted
                family names), so they survive React SSR style serialization. */}
            {hasCssVars ? (
                <div style={cssVars}>{children}</div>
            ) : (
                children
            )}
        </>
    );
}
