import "./globals.css";
import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import NavStyleProvider from "@/components/NavStyleProvider";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";
import { getSetting } from "@/services/settings";
import { siteFontsClassName } from "@/lib/siteFonts";
import { DEFAULT_SITE_TITLE, SITE_DESCRIPTION, SITE_NAME, SOCIAL_IMAGE, siteUrl } from "@/lib/site-metadata";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const baseUrl = siteUrl();

const defaultTitle =
  process.env.SITE_TITLE?.trim() || DEFAULT_SITE_TITLE;

export async function generateMetadata() {
  const dbTitle = await getSetting("site_title");
  const title = dbTitle?.trim() || defaultTitle;
  return {
    title,
    description: SITE_DESCRIPTION,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description: SITE_DESCRIPTION,
      siteName: SITE_NAME,
      type: "website",
      images: [SOCIAL_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESCRIPTION,
      images: [SOCIAL_IMAGE.url]
    },
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
        className={`m-0 flex min-h-svh flex-col bg-canvas text-chestnut-dark dark:bg-dark-canvas dark:text-dark-text ${siteFontsClassName}`}
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
