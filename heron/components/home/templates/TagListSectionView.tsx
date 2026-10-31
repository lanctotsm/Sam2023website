import type { TagListSectionData } from "@/lib/frontPageDefaults";
import ServerLucideIcon from "@/components/home/ServerLucideIcon";
import { homeBodyClass, homeHeadingStyle, homeSectionTitleClass } from "@/components/home/homeSectionStyles";

export function TagListSectionView({ data }: { data: TagListSectionData }) {
    return (
        <section>
            <h2 className={`mb-6 ${homeSectionTitleClass}`} style={homeHeadingStyle}>
                {data.heading}
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
                {data.items.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center gap-2 rounded-full border border-[var(--page-card-border,var(--color-desert-tan-dark))] bg-[var(--page-card-bg,var(--color-surface))] px-4 py-2.5 text-[0.95rem] ${homeBodyClass} transition-all hover:scale-105 hover:bg-white dark:border-[var(--page-card-border-dark,var(--color-dark-muted))] dark:bg-[var(--page-card-bg-dark,var(--color-dark-surface))] dark:hover:bg-dark-bg`}
                    >
                        <ServerLucideIcon name={item.icon} size={20} />
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
