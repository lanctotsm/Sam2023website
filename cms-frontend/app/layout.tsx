import "./globals.css";
import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";

export const metadata = {
  title: "Sam's CMS",
  description: "Lightsail CMS rewrite"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
