import "./globals.css";
import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import Providers from "@/app/providers";

const baseUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata = {
  title: "Heron",
  description: "Modern SQLite CMS",
  metadataBase: new URL(baseUrl),
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml"
    }
  }
};

const themeScript = `
(function() {
  var t = localStorage.getItem('theme');
  var dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS Feed"
          href={`${baseUrl.replace(/\/+$/, "")}/feed.xml`}
        />
      </head>
      <body className="m-0 bg-caramel-light text-chestnut-dark dark:bg-dark-bg dark:text-dark-text">
        <Providers>
          <Navigation />
          <main className="mx-auto max-w-[1100px] px-5 py-8 pb-20">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
