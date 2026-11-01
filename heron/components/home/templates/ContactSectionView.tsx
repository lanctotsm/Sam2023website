import type { ContactSectionData } from "@/lib/frontPageDefaults";
import { safeHttpUrl } from "@/lib/safe-url";
import ServerLucideIcon from "@/components/home/ServerLucideIcon";
import {
    homeBodyClass,
    homeBodyStyle,
    homeCardClass,
    homeSectionTitleClass,
    homeHeadingStyle,
} from "@/components/home/homeSectionStyles";

export function ContactSectionView({ data }: { data: ContactSectionData }) {
    return (
        <section className={`${homeCardClass} text-center`}>
            <h2 className={homeSectionTitleClass} style={homeHeadingStyle}>
                {data.heading}
            </h2>
            <p
                className={`mx-auto mb-6 max-w-[600px] text-[1.05rem] leading-relaxed ${homeBodyClass}`}
                style={homeBodyStyle}
            >
                {data.text}
            </p>
            {data.showSocials && (
                <div className="flex flex-wrap justify-center gap-4">
                    {data.links.map((link) => {
                        const href = safeHttpUrl(link.url);
                        const className =
                            "flex items-center gap-2 rounded-lg bg-chestnut px-6 py-3 font-semibold text-desert-tan transition-all hover:-translate-y-0.5 hover:bg-chestnut-light dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light";
                        const content = (
                            <>
                                <ServerLucideIcon name={link.icon} size={20} />
                                {link.label}
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
