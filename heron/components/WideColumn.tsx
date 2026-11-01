import type { ReactNode } from "react";

/**
 * Album pages sit wider than the 1100px reading measure used by the rest of
 * the public site. The column is centered on the viewport so it can extend
 * past the main column without moving the header or footer.
 */
export default function WideColumn({ children }: { children: ReactNode }) {
    return (
        <div className="relative left-1/2 w-[min(1440px,calc(100vw-2rem))] max-w-[1440px] -ml-[min(720px,calc(50vw-1rem))]">
            {children}
        </div>
    );
}
