import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Sam's CMS",
  description: "Lightsail CMS rewrite"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <Link href="/">Home</Link>
          <Link href="/posts">Posts</Link>
          <Link href="/albums">Albums</Link>
          <Link href="/admin/posts">Admin</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
