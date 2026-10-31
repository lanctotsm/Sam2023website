import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import SearchBar from "@/components/SearchBar";
import PublicNavLinks from "@/components/PublicNavLinks";

/** Leading slot for the site name. The work-first shell fills this in. */
function SiteWordmark(): ReactNode {
  return null;
}

export default function Navigation() {
  return (
    <nav
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4 lg:px-8 dark:border-white/10"
      style={{
        backgroundColor:
          "var(--nav-bg, color-mix(in srgb, var(--color-chestnut-light) 88%, transparent))",
        fontFamily: "var(--nav-font, inherit)",
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <PublicNavLinks leading={<SiteWordmark />} />

      <div className="flex items-center gap-3 text-sm" style={{ color: "var(--nav-text, var(--color-desert-tan))" }}>
        <div className="hidden sm:block">
          <SearchBar />
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
