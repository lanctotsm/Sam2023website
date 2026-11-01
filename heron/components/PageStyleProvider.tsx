import { getSetting } from "@/services/settings";
import { parsePageStyles } from "@/lib/frontPageDefaults";
import { buildPageBgStyle, buildPageCssVars } from "@/lib/pageStyleVars";
import { publicFontsClassName } from "@/lib/siteFonts";

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
    const fontClass = publicFontsClassName([style.headingFont, style.bodyFont]);

    const hasBg = background.backgroundType !== "none";
    const bgStyles = hasBg ? buildPageBgStyle(background, { attachment: "fixed" }) : {};
    const hasBgStyles = Object.keys(bgStyles).length > 0;

    return (
        <>
            {/* Fixed background */}
            {hasBgStyles && (
                <div className="fixed inset-0 -z-10" style={bgStyles} />
            )}
            {/* Font classes live with the page styles so a client navigation
                picks up a newly saved family without waiting for the root layout. */}
            <div className={fontClass} style={hasCssVars ? cssVars : undefined}>
                {children}
            </div>
        </>
    );
}
