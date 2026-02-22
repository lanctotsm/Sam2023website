import "./globals.css";
import type { ReactNode } from "react";
import { Roboto } from "next/font/google";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";

const roboto = Roboto({ weight: "500", subsets: ["latin"] });

const baseUrl =
  process.env.NEXTAUTH_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000") ||
  "http://localhost:3000";

const siteTitle =
  (typeof process !== "undefined" && process.env.SITE_TITLE?.trim()) || "Sam's website";

export const metadata = {
  title: siteTitle,
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
      <body className={`m-0 bg-caramel-light text-chestnut-dark dark:bg-dark-bg dark:text-dark-text ${roboto.className}`}>
        <Providers>
          <Navigation />
          <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1100px] flex-col px-5 py-8 pb-6">
            {children}
            <Footer />
          </main>
        </Providers>
      </body>
    </html>
  );
}
