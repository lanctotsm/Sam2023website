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
    <footer className="site-footer">
      <div className="site-footer__container">
        <nav className="site-footer__nav" aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="site-footer__link"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="site-footer__copy">
          © {year} Samuel Lanctot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
