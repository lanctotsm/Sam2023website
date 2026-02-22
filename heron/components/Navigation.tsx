"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";
import SearchBar from "@/components/SearchBar";

type NavItem = {
  href: string;
  label: string;
  authOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/posts", label: "Posts" },
  { href: "/albums", label: "Albums" },
  { href: "/upload", label: "Upload", authOnly: true },
  { href: "/admin", label: "Admin", authOnly: true }
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user || null;
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return navItems.filter((item) => !item.authOnly || user);
  }, [user]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    router.push("/");
    router.refresh();
  };

  return (
    <nav className={`main-nav ${user ? "main-nav--authenticated" : ""}`} aria-label="Main navigation">
      <div className="main-nav__brand">
        <ul className="main-nav__list">
          {filteredItems.map((item) => (
            <li key={item.href} className="main-nav__item">
              <Link
                href={item.href}
                className={`main-nav__link ${pathname === item.href ? "main-nav__link--active" : ""}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="main-nav__toggle md:hidden flex flex-col gap-1.5 p-2"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span className={`block h-0.5 w-5 bg-desert-tan transition-transform ${mobileOpen ? "translate-y-1 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-desert-tan transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-desert-tan transition-transform ${mobileOpen ? "-translate-y-1 -rotate-45" : ""}`} />
        </button>
      </div>

      {mobileOpen && (
        <div className="main-nav__mobile w-full md:hidden">
          <div className="main-nav__mobile-search mb-3 sm:hidden">
            <SearchBar />
          </div>
          <ul className="main-nav__mobile-list flex flex-col gap-2 pt-4 border-t border-desert-tan/30">
            {filteredItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`main-nav__link ${pathname === item.href ? "main-nav__link--active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="main-nav__actions">
        <div className="main-nav__search hidden sm:block">
          <SearchBar />
        </div>
        <ThemeToggle />
        {status === "loading" ? (
          <span className="main-nav__status">Checking session...</span>
        ) : user ? (
          <>
            <span className="main-nav__user hidden sm:inline-block" title={user.email || undefined}>
              {user.email || "Signed in"}
            </span>
            <button className="main-nav__logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}
