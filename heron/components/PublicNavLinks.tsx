"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import SearchBar from "@/components/SearchBar";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/posts", label: "Posts" },
  { href: "/albums", label: "Albums" },
];

/**
 * Public links and the mobile drawer. Session controls stay in the admin layout.
 * `leading` is the wordmark slot; the server header fills it later.
 */
export default function PublicNavLinks({ leading }: { leading?: ReactNode }) {
  const pathname = usePathname();
  const [openedOnPath, setOpenedOnPath] = useState<string | null>(null);
  const mobileOpen = openedOnPath === pathname;
  const setMobileOpen = (open: boolean) => setOpenedOnPath(open ? pathname : null);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const navLinkClass = (item: NavItem) =>
    `flex min-h-[44px] items-center rounded-full px-3 text-[0.95rem] transition-colors md:fine-pointer:min-h-0 md:fine-pointer:py-2 ${
      pathname === item.href ? "bg-caramel/25 font-semibold" : "hover:bg-white/10"
    }`;

  const navLinkStyle: CSSProperties = {
    color: "var(--nav-text, var(--color-desert-tan))",
  };

  const navLinkActiveStyle: CSSProperties = {
    color: "var(--nav-accent, var(--nav-text, var(--color-desert-tan)))",
  };

  return (
    <>
      <div className="flex flex-1 items-center justify-between md:flex-initial md:justify-start">
        <div className="flex min-w-0 items-center gap-2">
          {leading}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={navLinkClass(item)}
                style={pathname === item.href ? navLinkActiveStyle : navLinkStyle}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="tap-target flex-col gap-1.5 rounded md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span
            className={`block h-0.5 w-5 bg-desert-tan transition-transform ${mobileOpen ? "translate-y-1 rotate-45" : ""
              }`}
          />
          <span
            className={`block h-0.5 w-5 bg-desert-tan transition-opacity ${mobileOpen ? "opacity-0" : ""
              }`}
          />
          <span
            className={`block h-0.5 w-5 bg-desert-tan transition-transform ${mobileOpen ? "-translate-y-1 -rotate-45" : ""
              }`}
          />
        </button>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100svh-4rem)] w-full overflow-y-auto overscroll-contain md:hidden">
          <div className="mb-3 flex flex-col border-t border-desert-tan/30 pt-4 sm:hidden dark:border-dark-muted/30">
            <SearchBar fullWidth />
          </div>
          <div className="flex flex-col gap-1 border-t border-desert-tan/30 pt-4 dark:border-dark-muted/30">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={navLinkClass(item)}
                style={pathname === item.href ? navLinkActiveStyle : navLinkStyle}
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
