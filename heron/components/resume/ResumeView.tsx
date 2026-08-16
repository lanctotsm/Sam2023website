import type { ResumeDocument } from "@/lib/resume/types";
import { isStandardSectionId } from "@/lib/resume/defaults";
import { RESUME_SECTION_REGISTRY } from "./resumeSectionRegistry";
import { CustomSectionView } from "./sections/CustomSection";
import {
    bodyFontStyle,
    headingFontStyle,
    linkText,
    sectionCard,
    sectionHeading
} from "./styles";

export function isResumeEmpty(doc: ResumeDocument): boolean {
    return (
        !doc.basics.name &&
        !doc.basics.summary &&
        doc.work.length === 0 &&
        doc.projects.length === 0 &&
        doc.skills.length === 0 &&
        doc.education.length === 0 &&
        doc.certificates.length === 0 &&
        doc.meta.heron.customSections.every((section) => section.entries.length === 0)
    );
}

function displayUrl(url: string): string {
    return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function BasicsHeader({ doc }: { doc: ResumeDocument }) {
    const { basics } = doc;
    const locationText = [basics.location.city, basics.location.region]
        .filter(Boolean)
        .join(", ");
    return (
        <section className={`${sectionCard} text-center`}>
            <h1
                className="mb-2 text-center text-[var(--page-h1-color,var(--color-chestnut))] dark:text-[var(--page-h1-color-dark,var(--color-dark-text))]"
                style={headingFontStyle}
            >
                {basics.name}
            </h1>
            {basics.label && (
                <p
                    className="m-0 text-sm uppercase tracking-[0.14em] text-olive-dark dark:text-dark-muted"
                    style={bodyFontStyle}
                >
                    {basics.label}
                </p>
            )}
            <p
                className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-[var(--page-body-color,var(--color-olive-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]"
                style={bodyFontStyle}
            >
                {locationText && <span>{locationText}</span>}
                {basics.email && (
                    <a href={`mailto:${basics.email}`} className={linkText}>
                        {basics.email}
                    </a>
                )}
                {basics.phone && (
                    <a href={`tel:${basics.phone.replace(/[^+\d]/g, "")}`} className={linkText}>
                        {basics.phone}
                    </a>
                )}
                {basics.url && (
                    <a href={basics.url} target="_blank" rel="noopener noreferrer" className={linkText}>
                        {displayUrl(basics.url)}
                    </a>
                )}
                {basics.profiles.map(
                    (profile) =>
                        profile.url && (
                            <a
                                key={profile.id}
                                href={profile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={linkText}
                            >
                                {profile.network || displayUrl(profile.url)}
                            </a>
                        )
                )}
            </p>
            {basics.summary && (
                <p
                    className="mx-auto mb-0 mt-4 max-w-[640px] text-left leading-relaxed text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]"
                    style={bodyFontStyle}
                >
                    {basics.summary}
                </p>
            )}
        </section>
    );
}

/** The single web renderer: basics header plus sections in stored order,
 * skipping hidden and empty ones. */
export default function ResumeView({ doc }: { doc: ResumeDocument }) {
    const hidden = new Set(doc.meta.heron.hiddenSections);
    const customById = new Map(
        doc.meta.heron.customSections.map((section) => [section.id, section])
    );

    return (
        <div className="mx-auto flex max-w-[900px] flex-col gap-6">
            <BasicsHeader doc={doc} />
            {doc.meta.heron.sectionOrder.map((id) => {
                if (hidden.has(id)) return null;

                if (isStandardSectionId(id)) {
                    const def = RESUME_SECTION_REGISTRY[id];
                    if (def.isEmpty(doc)) return null;
                    const View = def.View;
                    return (
                        <section key={id} className={sectionCard}>
                            <h2 className={sectionHeading} style={headingFontStyle}>
                                {def.label}
                            </h2>
                            <View doc={doc} />
                        </section>
                    );
                }

                const custom = customById.get(id);
                if (!custom || custom.entries.length === 0) return null;
                return (
                    <section key={id} className={sectionCard}>
                        <h2 className={sectionHeading} style={headingFontStyle}>
                            {custom.heading}
                        </h2>
                        <CustomSectionView section={custom} />
                    </section>
                );
            })}
        </div>
    );
}
