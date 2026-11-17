import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: `Page not found — ${SITE_NAME}`,
  robots: { index: false }
};

const suggestedLinks = [
  { href: "/", label: "Home" },
  { href: "/posts", label: "Posts" },
  { href: "/albums", label: "Albums" },
  { href: "/resume", label: "Resume" }
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[900px]">
      <section className="surface-card text-center">
        <h1 className="mb-2 text-[var(--page-h1-color,var(--color-chestnut))] dark:text-[var(--page-h1-color-dark,var(--color-dark-text))]">
          Page not found
        </h1>
        <p className="m-0 text-[var(--page-body-color,var(--color-olive-dark))] dark:text-[var(--page-body-color-dark,var(--color-dark-muted))]">
          This page may have moved, or it may never have existed.
        </p>
        <nav aria-label="Helpful links" className="mt-6 flex flex-wrap justify-center gap-2">
          {suggestedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-copper transition-colors hover:text-chestnut dark:text-caramel-light dark:hover:text-desert-tan"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
