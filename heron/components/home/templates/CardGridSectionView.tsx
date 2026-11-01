import type { CardGridSectionData } from "@/lib/frontPageDefaults";
import ServerLucideIcon from "@/components/home/ServerLucideIcon";
import {
    homeBodyStyle,
    homeCardClass,
    homeH2Class,
    homeSectionTitleClass,
    homeHeadingStyle,
} from "@/components/home/homeSectionStyles";

export function CardGridSectionView({ data }: { data: CardGridSectionData }) {
    const gridCols =
        data.columns === 1
            ? "grid-cols-1"
            : data.columns === 3
              ? "sm:grid-cols-3"
              : data.columns === 4
                ? "sm:grid-cols-2 lg:grid-cols-4"
                : "sm:grid-cols-2";
    return (
        <section>
            <h2 className={`mb-6 ${homeSectionTitleClass}`} style={homeHeadingStyle}>
                {data.heading}
            </h2>
            <div className={`grid gap-5 ${gridCols}`}>
                {data.items.map((item, idx) => (
                    <div
                        key={idx}
                        className={`${homeCardClass} text-center transition-all hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-none`}
                    >
                        <div className={`mb-3 flex justify-center ${homeH2Class}`}>
                            <ServerLucideIcon name={item.icon} size={36} />
                        </div>
                        <h3 className={`mb-3 text-lg ${homeH2Class}`} style={homeHeadingStyle}>
                            {item.title}
                        </h3>
                        <p
                            className="text-sm leading-relaxed text-[var(--page-body-color,var(--color-olive-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]"
                            style={homeBodyStyle}
                        >
                            {item.text}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
