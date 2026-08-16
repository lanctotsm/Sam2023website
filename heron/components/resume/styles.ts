/** Shared styling for the public resume view, matching the page-style
 * variable conventions used across public pages. */

export const sectionCard = "surface-card resume-section";

export const sectionHeading =
    "heading-rule text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]";

export const bodyText =
    "text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]";

export const mutedText = "text-olive-dark dark:text-dark-muted";

export const linkText =
    "tap-inline text-[var(--page-link-color,var(--color-copper))] hover:underline dark:text-[var(--page-link-color-dark,var(--color-caramel-light))]";

export const entryClass =
    "resume-entry border-b border-hairline pb-5 pt-4 first:pt-2 last:border-b-0 last:pb-0 dark:border-dark-hairline";

export const headingFontStyle = {
    fontFamily: "var(--page-heading-font, var(--font-display))"
} as const;

export const bodyFontStyle = { fontFamily: "var(--page-body-font, inherit)" } as const;
