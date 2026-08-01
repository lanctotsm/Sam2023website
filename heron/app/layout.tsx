import "./globals.css";
import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import Navigation from "@/components/Navigation";
import NavStyleProvider from "@/components/NavStyleProvider";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";
import { getSetting } from "@/services/settings";

const displayFont = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display"
});

const bodyFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body"
});

const baseUrl =
  process.env.NEXTAUTH_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000") ||
  "http://localhost:3000";

const defaultTitle =
  (typeof process !== "undefined" && process.env.SITE_TITLE?.trim()) || "Sam's website";

export async function generateMetadata() {
  const dbTitle = await getSetting("site_title");
  return {
    title: dbTitle || defaultTitle,
    description: "Modern SQLite CMS",
    metadataBase: new URL(baseUrl),
    alternates: {
      types: {
        "application/rss+xml": "/feed.xml"
      }
    }
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Required for env(safe-area-inset-*) to resolve on notched devices
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f0e4" },
    { media: "(prefers-color-scheme: dark)", color: "#171513" }
  ]
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
      <body
        className={`m-0 flex min-h-svh flex-col bg-canvas text-chestnut-dark dark:bg-dark-canvas dark:text-dark-text ${displayFont.variable} ${bodyFont.variable}`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-chestnut focus:px-4 focus:py-3 focus:text-desert-tan"
        >
          Skip to content
        </a>
        <Providers>
          <NavStyleProvider>
            <Navigation />
          </NavStyleProvider>
          <main
            id="main-content"
            className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          >
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
