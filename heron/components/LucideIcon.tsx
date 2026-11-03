import { icons, type LucideProps } from "lucide-react";

type LucideIconProps = LucideProps & {
    name: string;
};

/**
 * Renders a Lucide icon by its name string (e.g. "Camera", "Mail").
 * Falls back to a placeholder square if the name isn't found.
 * Keep this module without a client boundary: public server views resolve the
 * catalog here and send only the selected icon data to Lucide's SVG renderer.
 * Admin client components can still import it for the complete icon picker.
 */
export default function LucideIcon({ name, ...props }: LucideIconProps) {
    const IconComponent = icons[name as keyof typeof icons];

    if (!IconComponent) {
        // Fallback: render a simple square placeholder
        return (
            <span
                className="inline-block rounded bg-desert-tan-dark/20 dark:bg-dark-muted/20"
                style={{ width: props.size || 24, height: props.size || 24 }}
                title={`Unknown icon: ${name}`}
            />
        );
    }

    return <IconComponent {...props} />;
}
