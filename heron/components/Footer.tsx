import Link from "next/link";
import { contactLinksFromFrontPage } from "@/lib/siteShare";
import { getSettings } from "@/services/settings";

const footerLinks = [
  { href: "/", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/posts", label: "Posts" },
  { href: "/albums", label: "Albums" }
];

function externalLink(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export default async function Footer() {
  const year = new Date().getFullYear();
  const settings = await getSettings(["footer_text", "front_page"]);
  const footerText = settings.footer_text?.trim() || `© ${year} Samuel Lanctot. All rights reserved.`;
  const contactLinks = contactLinksFromFrontPage(settings.front_page ?? null);

  return (
    <footer
      className="w-full shrink-0 border-t border-hairline bg-surface px-4 py-5 sm:px-6 lg:px-8 dark:border-dark-hairline dark:bg-dark-surface"
      style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-3">
        {contactLinks.length > 0 ? (
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1" aria-label="Contact">
            {contactLinks.map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={link.url}
                className="text-sm text-chestnut-dark hover:text-chestnut dark:text-dark-text dark:hover:text-desert-tan"
                {...(externalLink(link.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-col items-center justify-between gap-1 sm:flex-row sm:gap-4">
          <nav className="flex flex-wrap justify-center gap-1 sm:gap-3" aria-label="Footer">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-[44px] items-center rounded-lg px-2 text-xs font-medium text-olive transition-colors hover:text-chestnut dark:text-dark-muted dark:hover:text-dark-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-center text-xs text-olive dark:text-dark-muted">{footerText}</p>
        </div>
      </div>
    </footer>
  );
}
