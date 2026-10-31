import { icons, type LucideProps } from "lucide-react";

type ServerLucideIconProps = LucideProps & {
    name: string;
};

/**
 * Renders a Lucide icon on the server. Importing `icons` pulls in the whole
 * map, so this module must stay out of client components. The public page
 * receives the SVG, not the icon catalog.
 */
export default function ServerLucideIcon({ name, ...props }: ServerLucideIconProps) {
    const IconComponent = icons[name as keyof typeof icons];

    if (!IconComponent) {
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
