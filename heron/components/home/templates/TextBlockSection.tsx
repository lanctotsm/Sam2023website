import type { TextBlockSectionData } from "@/lib/frontPageDefaults";
import {
    homeBodyClass,
    homeBodyStyle,
    homeCardClass,
    homeSectionTitleClass,
    homeHeadingStyle,
} from "@/components/home/homeSectionStyles";

export function TextBlockSectionView({ data }: { data: TextBlockSectionData }) {
    return (
        <section className={homeCardClass}>
            <h2 className={homeSectionTitleClass} style={homeHeadingStyle}>
                {data.heading}
            </h2>
            <div className={`mt-4 space-y-4 text-[1.05rem] leading-relaxed ${homeBodyClass}`} style={homeBodyStyle}>
                {data.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                ))}
            </div>
        </section>
    );
}
