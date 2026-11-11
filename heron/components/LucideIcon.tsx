import { icons, type LucideProps } from "lucide-react";
import { legacyIconAliases } from "@/lib/icon-aliases";

type LucideIconProps = LucideProps & {
    name: string;
};

/**
 * Renders a Lucide icon by its name string (e.g. "Camera", "Mail").
 * Lookup order: an icon in the installed `icons` map, then the inline GitHub
 * mark (Lucide no longer ships brand icons), then a legacy alias for names
 * saved before the upgrade, and finally a placeholder square.
 * Keep this module without a client boundary: public server views resolve the
 * catalog here and send only the selected icon data to Lucide's SVG renderer.
 * Admin client components can still import it for the complete icon picker.
 */
export default function LucideIcon({ name, ...props }: LucideIconProps) {
    const IconComponent = icons[name as keyof typeof icons];

    if (IconComponent) {
        return <IconComponent {...props} />;
    }

    if (isGithubName(name)) {
        return <GithubIcon size={props.size} className={props.className} />;
    }

    // hasOwnProperty keeps inherited keys such as "constructor" from matching.
    if (Object.prototype.hasOwnProperty.call(legacyIconAliases, name)) {
        const AliasedIcon = icons[legacyIconAliases[name] as keyof typeof icons];

        if (AliasedIcon) {
            return <AliasedIcon {...props} />;
        }
    }

    // Fallback: render a simple square placeholder
    return (
        <span
            className="inline-block rounded bg-desert-tan-dark/20 dark:bg-dark-muted/20"
            style={{ width: props.size || 24, height: props.size || 24 }}
            title={`Unknown icon: ${name}`}
        />
    );
}

function isGithubName(name: string) {
    return name === "Github" || name === "GitHub";
}

/**
 * GitHub's Octicons mark (MIT licensed), inlined because Lucide removed its
 * brand icons in 1.x and no generic icon stands in for it.
 */
function GithubIcon({ size = 24, className }: Pick<LucideIconProps, "size" | "className">) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="currentColor"
            className={className ? `lucide lucide-github ${className}` : "lucide lucide-github"}
            aria-hidden="true"
        >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
    );
}
