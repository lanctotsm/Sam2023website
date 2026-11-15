import type { ContactSectionData } from "@/lib/frontPageDefaults";
import { linkExposesEmail, redactEmails } from "@/lib/public-contact";
import { safeHttpUrl } from "@/lib/safe-url";
import LucideIcon from "@/components/LucideIcon";
import { ContactForm } from "@/components/home/ContactForm";
import {
    homeBodyClass,
    homeBodyStyle,
    homeCardClass,
    homeSectionTitleClass,
    homeHeadingStyle,
} from "@/components/home/homeSectionStyles";

export function ContactSectionView({ data }: { data: ContactSectionData }) {
    const heading = redactEmails(data.heading) || "Contact";
    const text = redactEmails(data.text);
    const links = data.showSocials ? data.links.filter((link) => !linkExposesEmail(link)) : [];

    return (
        <section id="contact" className={`${homeCardClass} scroll-mt-24 text-center`}>
            <h2 className={homeSectionTitleClass} style={homeHeadingStyle}>
                {heading}
            </h2>
            {text ? (
                <p
                    className={`mx-auto mb-6 max-w-[600px] text-[1.05rem] leading-relaxed ${homeBodyClass}`}
                    style={homeBodyStyle}
                >
                    {text}
                </p>
            ) : null}
            <ContactForm />
            {links.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                    {links.map((link) => {
                        const href = safeHttpUrl(link.url);
                        const className =
                            "flex items-center gap-2 rounded-lg bg-chestnut px-6 py-3 font-semibold text-desert-tan transition-all hover:-translate-y-0.5 hover:bg-chestnut-light dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light";
                        const content = (
                            <>
                                <LucideIcon name={link.icon} size={20} />
                                {redactEmails(link.label)}
                            </>
                        );
                        if (!href) {
                            return (
                                <span key={link.label} className={className}>
                                    {content}
                                </span>
                            );
                        }
                        const external = href.startsWith("http");
                        return (
                            <a
                                key={link.label}
                                href={href}
                                target={external ? "_blank" : undefined}
                                rel={external ? "noopener noreferrer" : undefined}
                                className={className}
                            >
                                {content}
                            </a>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
