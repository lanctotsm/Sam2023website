/**
 * Icon names that were valid before the lucide-react 1.x upgrade but are gone
 * from its `icons` map. Saved home page configs still store these names, so
 * the renderer maps them to a Lucide icon that exists in the installed version.
 *
 * GitHub is not listed here: it has its own inline mark in LucideIcon.
 */
export const legacyIconAliases: Readonly<Record<string, string>> = {
    Music: "Headphones",
    Music2: "Headphones",
    Linkedin: "Briefcase",
    Twitter: "AtSign",
    Instagram: "Camera",
    Facebook: "Users",
    Youtube: "Video",
};
