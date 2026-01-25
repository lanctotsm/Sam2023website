"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/api";
import { getAuthStatus, logout } from "@/lib/api";

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getAuthStatus()
      .then((data) => {
        if (isMounted) {
          setUser(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    return navItems.filter((item) => !item.authOnly || user);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
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
        {loading ? (
          <span className="status muted">Checking session...</span>
        ) : user ? (
          <>
            <span className="status">Signed in</span>
            <button className="secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <span className="status muted">Guest</span>
        )}
      </div>
    </nav>
  );
}
