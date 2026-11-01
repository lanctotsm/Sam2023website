import type { CSSProperties } from "react";
import type { BannerSectionData } from "@/lib/frontPageDefaults";
import { homeBodyStyle, homeHeadingStyle } from "@/components/home/homeSectionStyles";

function bannerStyle(data: BannerSectionData): CSSProperties {
    switch (data.backgroundType) {
        case "image": {
            const isSafe = /^https?:\/\/|^\//.test(data.backgroundImage);
            if (!isSafe) return {};
            return {
                backgroundImage: `url(${data.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            };
        }
        case "color":
            return { backgroundColor: data.backgroundColor };
        case "gradient":
        default:
            if (data.gradientFrom && data.gradientTo) {
                return {
                    background: `linear-gradient(to bottom right, ${data.gradientFrom}, ${data.gradientTo})`,
                };
            }
            return {};
    }
}

function hasCustomBackground(data: BannerSectionData): boolean {
    if (data.backgroundType === "color" && data.backgroundColor) return true;
    if (data.backgroundType === "image" && data.backgroundImage) return true;
    if (data.backgroundType === "gradient" && data.gradientFrom && data.gradientTo) return true;
    return false;
}

export function BannerSectionView({ data }: { data: BannerSectionData }) {
    const customBg = hasCustomBackground(data);
    return (
        <section
            className={`-mx-4 mt-0 rounded-2xl px-5 py-10 text-center sm:-mx-6 sm:py-14 lg:-mx-8 lg:px-10 lg:py-20 ${
                customBg
                    ? "text-white"
                    : "bg-gradient-to-br from-chestnut to-chestnut-light text-desert-tan dark:from-chestnut-dark dark:to-chestnut"
            }`}
            style={customBg ? bannerStyle(data) : undefined}
        >
            <h1
                className={`mb-4 text-[length:var(--text-display)] font-bold ${customBg ? "" : "text-desert-tan"}`}
                style={homeHeadingStyle}
            >
                {data.title}
            </h1>
            <p
                className={`mx-auto max-w-[600px] text-lg leading-relaxed md:text-xl ${customBg ? "text-white/90" : "text-desert-tan-light"}`}
                style={homeBodyStyle}
            >
                {data.subtitle}
            </p>
        </section>
    );
}
