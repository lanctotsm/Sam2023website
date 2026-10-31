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
    const variant = data.variant === "band" || data.variant === "canvas" ? data.variant : "panel";
    const customBg = variant !== "canvas" && hasCustomBackground(data);
    const filled = variant !== "canvas";
    const shape =
        variant === "band"
            ? "-mx-4 mt-0 px-5 py-6 text-center sm:-mx-6 sm:py-8 lg:-mx-8 lg:px-10"
            : variant === "canvas"
              ? "mt-0 px-1 py-8 text-center sm:py-12"
              : "-mx-4 mt-0 rounded-2xl px-5 py-10 text-center sm:-mx-6 sm:py-14 lg:-mx-8 lg:px-10 lg:py-20";
    const palette = customBg
        ? "text-white"
        : filled
          ? "bg-gradient-to-br from-chestnut to-chestnut-light text-desert-tan dark:from-chestnut-dark dark:to-chestnut"
          : "text-chestnut dark:text-dark-text";
    const titleColor = customBg ? "" : filled ? "text-desert-tan" : "text-chestnut dark:text-dark-text";
    const subtitleColor = customBg
        ? "text-white/90"
        : filled
          ? "text-desert-tan-light"
          : "text-chestnut-dark dark:text-dark-muted";

    return (
        <section className={`${shape} ${palette}`} style={customBg ? bannerStyle(data) : undefined}>
            <h1 className={`mb-4 text-[length:var(--text-display)] font-bold ${titleColor}`} style={homeHeadingStyle}>
                {data.title}
            </h1>
            <p
                className={`mx-auto max-w-[600px] text-lg leading-relaxed md:text-xl ${subtitleColor}`}
                style={homeBodyStyle}
            >
                {data.subtitle}
            </p>
        </section>
    );
}
