import Link from "next/link";
import { getSetting } from "@/services/settings";

const footerLinks = [
  { href: "/", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/posts", label: "Posts" },
  { href: "/albums", label: "Albums" }
];

export default async function Footer() {
  const year = new Date().getFullYear();
  const customFooter = await getSetting("footer_text");
  const footerText = customFooter || `© ${year} Samuel Lanctot. All rights reserved.`;

  return (
    <footer
      className="w-full shrink-0 border-t border-hairline bg-surface px-4 py-5 sm:px-6 lg:px-8 dark:border-dark-hairline dark:bg-dark-surface"
      style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-1 sm:flex-row sm:gap-4">
        <nav className="flex flex-wrap justify-center gap-1 sm:gap-3">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-[44px] items-center rounded-lg px-2 text-sm font-medium text-chestnut-dark transition-colors hover:text-chestnut dark:text-dark-muted dark:hover:text-dark-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-center text-sm text-olive dark:text-dark-muted">
          {footerText}
        </p>
      </div>
    </footer>
  );
}
