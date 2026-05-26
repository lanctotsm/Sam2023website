import type { CSSProperties } from "react";

export const homeCardClass =
    "rounded-xl border border-[var(--page-card-border,var(--color-desert-tan-dark))] bg-[var(--page-card-bg,var(--color-surface))] p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-[var(--page-card-border-dark,var(--color-dark-muted))] dark:bg-[var(--page-card-bg-dark,var(--color-dark-surface))]";
export const homeH2Class =
    "text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]";
export const homeBodyClass =
    "text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-text))]";
export const homeHeadingStyle: CSSProperties = { fontFamily: "var(--page-heading-font, inherit)" };
export const homeBodyStyle: CSSProperties = { fontFamily: "var(--page-body-font, inherit)" };
