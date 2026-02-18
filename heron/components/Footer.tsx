import Link from "next/link";

const footerLinks = [
  { href: "/", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/posts", label: "Posts" },
  { href: "/albums", label: "Albums" }
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto shrink-0 border-t border-desert-tan-dark bg-surface px-5 py-6 dark:border-dark-muted dark:bg-dark-surface">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 sm:flex-row">
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-chestnut-dark transition-colors hover:text-chestnut dark:text-dark-muted dark:hover:text-dark-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-olive dark:text-dark-muted">
          © {year} Samuel Lanctot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
