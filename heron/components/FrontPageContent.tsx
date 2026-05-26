"use client";

import type { FrontPageSettings, HeroSectionData, HomeSection } from "@/lib/frontPageDefaults";
import { findSection } from "@/lib/frontPageDefaults";
import LucideIcon from "@/components/LucideIcon";

type Props = {
    config: FrontPageSettings;
};

function heroStyle(hero: HeroSectionData): React.CSSProperties {
    switch (hero.backgroundType) {
        case "image": {
            const isSafe = /^https?:\/\/|^\//.test(hero.backgroundImage);
            if (!isSafe) return {};
            return {
                backgroundImage: `url(${hero.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            };
        }
        case "color":
            return { backgroundColor: hero.backgroundColor };
        case "gradient":
        default:
            if (hero.gradientFrom && hero.gradientTo) {
                return {
                    background: `linear-gradient(to bottom right, ${hero.gradientFrom}, ${hero.gradientTo})`,
                };
            }
            return {};
    }
}

function hasCustomBackground(hero: HeroSectionData): boolean {
    if (hero.backgroundType === "color" && hero.backgroundColor) return true;
    if (hero.backgroundType === "image" && hero.backgroundImage) return true;
    if (hero.backgroundType === "gradient" && hero.gradientFrom && hero.gradientTo) return true;
    return false;
}

const cardClass =
    "rounded-xl border border-[var(--page-card-border,var(--color-desert-tan-dark))] bg-[var(--page-card-bg,var(--color-surface))] p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-[var(--page-card-border-dark,var(--color-dark-muted))] dark:bg-[var(--page-card-bg-dark,var(--color-dark-surface))]";
const h2Class =
    "text-[var(--page-h2-color,var(--color-chestnut))] dark:text-[var(--page-h2-color-dark,var(--color-dark-text))]";
const bodyClass =
    "text-[var(--page-body-color,var(--color-chestnut-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-text))]";
const headingStyle: React.CSSProperties = { fontFamily: "var(--page-heading-font, inherit)" };
const bodyStyle: React.CSSProperties = { fontFamily: "var(--page-body-font, inherit)" };

function TextBlockSection({ heading, paragraphs }: { heading: string; paragraphs: string[] }) {
    return (
        <section className={cardClass}>
            <h2 className={h2Class} style={headingStyle}>
                {heading}
            </h2>
            <div className={`mt-4 space-y-4 text-[1.05rem] leading-relaxed ${bodyClass}`} style={bodyStyle}>
                {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                ))}
            </div>
        </section>
    );
}

function renderHomeSection(section: HomeSection) {
    switch (section.type) {
        case "hero": {
            const hero = section.data;
            const customBg = hasCustomBackground(hero);
            return (
                <section
                    key={section.id}
                    className={`-mx-5 mt-0 rounded-2xl px-5 py-12 text-center md:-mx-5 md:px-10 md:py-20 ${
                        customBg
                            ? "text-white"
                            : "bg-gradient-to-br from-chestnut to-chestnut-light text-desert-tan dark:from-chestnut-dark dark:to-chestnut"
                    }`}
                    style={customBg ? heroStyle(hero) : undefined}
                >
                    <h1
                        className={`mb-4 text-3xl font-bold md:text-5xl ${customBg ? "" : "text-desert-tan"}`}
                        style={headingStyle}
                    >
                        {hero.title}
                    </h1>
                    <p
                        className={`mx-auto max-w-[600px] text-lg leading-relaxed md:text-xl ${customBg ? "text-white/90" : "text-desert-tan-light"}`}
                        style={bodyStyle}
                    >
                        {hero.subtitle}
                    </p>
                </section>
            );
        }
        case "textBlock":
            return (
                <TextBlockSection
                    key={section.id}
                    heading={section.data.heading}
                    paragraphs={section.data.paragraphs}
                />
            );
        case "cards": {
            const cards = section.data;
            const gridCols =
                cards.columns === 1
                    ? "grid-cols-1"
                    : cards.columns === 3
                      ? "sm:grid-cols-3"
                      : cards.columns === 4
                        ? "sm:grid-cols-2 lg:grid-cols-4"
                        : "sm:grid-cols-2";
            return (
                <section key={section.id}>
                    <h2 className={`mb-6 ${h2Class}`} style={headingStyle}>
                        {cards.heading}
                    </h2>
                    <div className={`grid gap-5 ${gridCols}`}>
                        {cards.items.map((item, idx) => (
                            <div
                                key={idx}
                                className={`${cardClass} p-6 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(72,9,3,0.12)] dark:hover:shadow-none`}
                            >
                                <div className={`mb-3 flex justify-center ${h2Class}`}>
                                    <LucideIcon name={item.icon} size={36} />
                                </div>
                                <h3 className={`mb-3 text-lg ${h2Class}`} style={headingStyle}>
                                    {item.title}
                                </h3>
                                <p
                                    className="text-sm leading-relaxed text-[var(--page-body-color,var(--color-olive-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]"
                                    style={bodyStyle}
                                >
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            );
        }
        case "interests": {
            const interests = section.data;
            return (
                <section key={section.id}>
                    <h2 className={`mb-6 ${h2Class}`} style={headingStyle}>
                        {interests.heading}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {interests.items.map((item, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-2 rounded-full border border-[var(--page-card-border,var(--color-desert-tan-dark))] bg-[var(--page-card-bg,var(--color-surface))] px-4 py-2.5 text-[0.95rem] ${bodyClass} transition-all hover:scale-105 hover:bg-white dark:border-[var(--page-card-border-dark,var(--color-dark-muted))] dark:bg-[var(--page-card-bg-dark,var(--color-dark-surface))] dark:hover:bg-dark-bg`}
                            >
                                <LucideIcon name={item.icon} size={20} />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </section>
            );
        }
        case "contact": {
            const contact = section.data;
            return (
                <section key={section.id} className={`${cardClass} text-center`}>
                    <h2 className={h2Class} style={headingStyle}>
                        {contact.heading}
                    </h2>
                    <p
                        className={`mx-auto mb-6 max-w-[600px] text-[1.05rem] leading-relaxed ${bodyClass}`}
                        style={bodyStyle}
                    >
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
            );
        }
        default:
            return null;
    }
}

export default function FrontPageContent({ config }: Props) {
    return (
        <div className="flex flex-col gap-8">
            {config.sectionOrder.map((id) => {
                const section = findSection(config, id);
                if (!section) return null;
                return renderHomeSection(section);
            })}
        </div>
    );
}
