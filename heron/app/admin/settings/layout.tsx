import type { ReactNode } from "react";
import { siteFontsClassName } from "@/lib/siteFonts";

/** The font picker previews every curated family, so settings loads the full set. */
export default function AdminSettingsLayout({ children }: { children: ReactNode }) {
  return <div className={siteFontsClassName}>{children}</div>;
}
