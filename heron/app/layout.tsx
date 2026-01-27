import "./globals.css";
import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import Providers from "@/app/providers";

export const metadata = {
  title: "Heron",
  description: "Modern SQLite CMS"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
