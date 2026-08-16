import type { Metadata } from "next";
import PageStyleProvider from "@/components/PageStyleProvider";
import ResumeView, { isResumeEmpty } from "@/components/resume/ResumeView";
import { getResume } from "@/services/resume";
import { toPersonJsonLd } from "@/lib/resume/jsonLd";

const baseUrl = (process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

export async function generateMetadata(): Promise<Metadata> {
    const doc = await getResume();
    const title = doc.basics.name ? `Resume — ${doc.basics.name}` : "Resume";
    const description =
        doc.basics.summary ||
        (doc.basics.label && doc.basics.name
            ? `${doc.basics.name}, ${doc.basics.label}`
            : "Resume");
    return {
        title,
        description,
        alternates: { canonical: `${baseUrl}/resume` },
        openGraph: { title, description, url: `${baseUrl}/resume`, type: "profile" }
    };
}

export default async function ResumePage() {
    const doc = await getResume();
    const jsonLd = toPersonJsonLd(doc, baseUrl);

    return (
        <PageStyleProvider page="resume">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
            />
            {isResumeEmpty(doc) ? (
                <div className="mx-auto max-w-[900px]">
                    <section className="surface-card text-center">
                        <h1 className="mb-2 text-[var(--page-h1-color,var(--color-chestnut))] dark:text-[var(--page-h1-color-dark,var(--color-dark-text))]">
                            Resume coming soon
                        </h1>
                        <p className="m-0 text-[var(--page-body-color,var(--color-olive-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]">
                            This page is being put together. Check back shortly.
                        </p>
                    </section>
                </div>
            ) : (
                <ResumeView doc={doc} />
            )}
        </PageStyleProvider>
    );
}
