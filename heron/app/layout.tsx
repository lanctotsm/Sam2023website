import "./globals.css";
import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";

const baseUrl =
  process.env.NEXTAUTH_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000") ||
  "http://localhost:3000";

export const metadata = {
  title: "Sam's website",
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
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS Feed"
          href={`${baseUrl.replace(/\/+$/, "")}/feed.xml`}
        />
      </head>
      <body className="body-layout">
        <Providers>
          <header className="site-header">
            <Navigation />
          </header>
          <main className="main-content container">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
