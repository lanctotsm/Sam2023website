"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { signOut, useSession } from "next-auth/react";

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

  const filteredItems = useMemo(() => {
    return navItems.filter((item) => !item.authOnly || user);
  }, [user]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    router.push("/");
    router.refresh();
  };

  return (
    <nav className={`navbar ${user ? "navbar-auth" : "navbar-guest"}`}>
      <div className="navbar-links">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            className={`navlink ${pathname === item.href ? "active" : ""}`}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="navbar-status">
        {status === "loading" ? (
          <span className="status muted">Checking session...</span>
        ) : user ? (
          <>
            <span className="status">Signed in</span>
            <button className="secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}
