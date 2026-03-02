"use client";

import type { FrontPageSettings } from "@/lib/frontPageDefaults";
import LucideIcon from "@/components/LucideIcon";

type Props = {
    config: FrontPageSettings;
};

function heroStyle(hero: FrontPageSettings["hero"]): React.CSSProperties {
    switch (hero.backgroundType) {
        case "image": {
            const isSafe = /^https?:\/\/|^\//.test(hero.backgroundImage);
            if (!isSafe) return {};
            return {
                backgroundImage: `url(${hero.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
            };
        }
        case "color":
            return { backgroundColor: hero.backgroundColor };
        case "gradient":
        default:
            if (hero.gradientFrom && hero.gradientTo) {
                return { background: `linear-gradient(to bottom right, ${hero.gradientFrom}, ${hero.gradientTo})` };
            }
            // Fall back to theme gradient via class
            return {};
    }
}

function hasCustomBackground(hero: FrontPageSettings["hero"]): boolean {
    if (hero.backgroundType === "color" && hero.backgroundColor) return true;
    if (hero.backgroundType === "image" && hero.backgroundImage) return true;
    if (hero.backgroundType === "gradient" && hero.gradientFrom && hero.gradientTo) return true;
    return false;
}

export default function FrontPageContent({ config }: Props) {
    const { hero, about, cards, journey, interests, contact } = config;
    const customBg = hasCustomBackground(hero);
    const gridCols =
        cards.columns === 1
            ? "grid-cols-1"
            : cards.columns === 3
                ? "sm:grid-cols-3"
                : cards.columns === 4
                    ? "sm:grid-cols-2 lg:grid-cols-4"
                    : "sm:grid-cols-2";

    return (
        <div className="flex flex-col gap-8">
            {/* Hero */}
            <section
                className={`-mx-5 mt-0 rounded-2xl px-5 py-12 text-center md:-mx-5 md:px-10 md:py-20 ${customBg ? "text-white" : "bg-gradient-to-br from-chestnut to-chestnut-light text-desert-tan dark:from-chestnut-dark dark:to-chestnut"
                    }`}
                style={customBg ? heroStyle(hero) : undefined}
            >
                <h1 className={`mb-4 text-3xl font-bold md:text-5xl ${customBg ? "" : "text-desert-tan"}`}>
                    {hero.title}
                </h1>
                <p className={`mx-auto max-w-[600px] text-lg leading-relaxed md:text-xl ${customBg ? "text-white/90" : "text-desert-tan-light"}`}>
                    {hero.subtitle}
                </p>
            </section>

            {/* About */}
            <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
                <h2 className="text-chestnut dark:text-dark-text">{about.heading}</h2>
                <div className="mt-4 space-y-4 text-[1.05rem] leading-relaxed text-chestnut-dark dark:text-dark-text">
                    {about.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
            </section>

            {/* Cards */}
            <section>
                <h2 className="mb-6 text-chestnut dark:text-dark-text">{cards.heading}</h2>
                <div className={`grid gap-5 ${gridCols}`}>
                    {cards.items.map((item, idx) => (
                        <div
                            key={idx}
                            className="rounded-xl border border-desert-tan-dark bg-surface p-6 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(72,9,3,0.12)] dark:border-dark-muted dark:bg-dark-surface dark:hover:shadow-none"
                        >
                            <div className="mb-3 flex justify-center text-chestnut dark:text-dark-text">
                                <LucideIcon name={item.icon} size={36} />
                            </div>
                            <h3 className="mb-3 text-lg text-chestnut dark:text-dark-text">{item.title}</h3>
                            <p className="text-sm leading-relaxed text-olive-dark dark:text-dark-muted">
                                {item.text}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Journey */}
            <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
                <h2 className="text-chestnut dark:text-dark-text">{journey.heading}</h2>
                <div className="mt-4 space-y-4 text-[1.05rem] leading-relaxed text-chestnut-dark dark:text-dark-muted">
                    {journey.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
            </section>

            {/* Interests */}
            <section>
                <h2 className="mb-6 text-chestnut dark:text-dark-text">{interests.heading}</h2>
                <div className="flex flex-wrap justify-center gap-3">
                    {interests.items.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 rounded-full border border-desert-tan-dark bg-surface px-4 py-2.5 text-[0.95rem] text-chestnut-dark transition-all hover:scale-105 hover:bg-white dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-bg"
                        >
                            <LucideIcon name={item.icon} size={20} />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact */}
            <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
                <h2 className="text-chestnut dark:text-dark-text">{contact.heading}</h2>
                <p className="mx-auto mb-6 max-w-[600px] text-[1.05rem] leading-relaxed text-chestnut-dark dark:text-dark-text">
                    {contact.text}
                </p>
                {contact.showSocials && (
                    <div className="flex flex-wrap justify-center gap-4">
                        {contact.links.map((link) => (
                            <a
                                key={link.label}
                                href={link.url}
                                target={link.url.startsWith("http") ? "_blank" : undefined}
                                rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                className="flex items-center gap-2 rounded-lg bg-chestnut px-6 py-3 font-semibold text-desert-tan transition-all hover:-translate-y-0.5 hover:bg-chestnut-light dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"
                            >
                                <LucideIcon name={link.icon} size={20} />
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
