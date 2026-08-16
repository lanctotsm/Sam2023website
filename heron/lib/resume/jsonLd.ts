/** Maps the resume document to a Schema.org `Person` for embedding on
 * `/resume`. This is what crawlers consume — they read the page, not the
 * JSON export. */

import type { ResumeDocument } from "./types";

export function toPersonJsonLd(
    doc: ResumeDocument,
    baseUrl: string
): Record<string, unknown> {
    const { basics } = doc;
    const person: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Person"
    };

    if (basics.name) person.name = basics.name;
    if (basics.label) person.jobTitle = basics.label;
    if (basics.summary) person.description = basics.summary;
    if (basics.email) person.email = `mailto:${basics.email}`;
    if (basics.phone) person.telephone = basics.phone;
    if (basics.url) person.url = basics.url;

    if (basics.location.city || basics.location.region) {
        const address: Record<string, unknown> = { "@type": "PostalAddress" };
        if (basics.location.city) address.addressLocality = basics.location.city;
        if (basics.location.region) address.addressRegion = basics.location.region;
        person.address = address;
    }

    const sameAs = basics.profiles.map((profile) => profile.url).filter((url) => url);
    if (sameAs.length > 0) person.sameAs = sameAs;

    const hidden = new Set(doc.meta.heron.hiddenSections);

    if (!hidden.has("work")) {
        const current = doc.work.find((entry) => entry.endDate === "" && entry.name);
        if (current) {
            const organization: Record<string, unknown> = {
                "@type": "Organization",
                name: current.name
            };
            if (current.url) organization.url = current.url;
            person.worksFor = organization;
        }
    }

    if (!hidden.has("education")) {
        const alumniOf = doc.education
            .filter((entry) => entry.institution)
            .map((entry) => {
                const school: Record<string, unknown> = {
                    "@type": "EducationalOrganization",
                    name: entry.institution
                };
                if (entry.url) school.url = entry.url;
                return school;
            });
        if (alumniOf.length > 0) person.alumniOf = alumniOf;
    }

    if (!hidden.has("skills") || !hidden.has("interests")) {
        const knowsAbout = [
            ...(!hidden.has("skills") ? doc.skills.flatMap((group) => group.keywords) : []),
            ...(!hidden.has("interests") ? doc.interests.flatMap((group) => group.keywords) : [])
        ];
        if (knowsAbout.length > 0) person.knowsAbout = knowsAbout;
    }

    if (!hidden.has("certificates")) {
        const hasCredential = doc.certificates
            .filter((entry) => entry.name)
            .map((entry) => {
                const credential: Record<string, unknown> = {
                    "@type": "EducationalOccupationalCredential",
                    name: entry.name
                };
                if (entry.issuer) {
                    credential.recognizedBy = { "@type": "Organization", name: entry.issuer };
                }
                if (entry.url) credential.url = entry.url;
                return credential;
            });
        if (hasCredential.length > 0) person.hasCredential = hasCredential;
    }

    if (basics.name) {
        person.mainEntityOfPage = `${baseUrl.replace(/\/+$/, "")}/resume`;
    }

    return person;
}
