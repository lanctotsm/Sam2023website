import type { CSSProperties } from "react";

export const homeCardClass = "surface-card";
export const homeH2Class =
    "text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]";
/** Section-level headings, which carry the caramel accent rule. */
export const homeSectionTitleClass = `heading-rule ${homeH2Class}`;
export const homeBodyClass =
    "text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-text))]";
export const homeHeadingStyle: CSSProperties = { fontFamily: "var(--page-heading-font, var(--font-display))" };
export const homeBodyStyle: CSSProperties = { fontFamily: "var(--page-body-font, inherit)" };
