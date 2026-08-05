"use client";

import { useEffect, useId, useRef } from "react";
import { peechoButtonScriptId } from "@/lib/print/catalog";

const SCRIPT_ATTR = "data-peecho-button-script";

function ensurePeechoScript(scriptId: string) {
  if (typeof document === "undefined" || !scriptId) return;
  if (document.querySelector(`script[${SCRIPT_ATTR}]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://d3aln0nj58oevo.cloudfront.net/button/script/${encodeURIComponent(scriptId)}.js`;
  script.setAttribute(SCRIPT_ATTR, "1");
  document.body.appendChild(script);
}

export type PeechoPrintButtonProps = {
  src: string;
  thumbnail?: string;
  title?: string;
  widthMm: number;
  heightMm: number;
  currency?: string;
  /** When true, hide Peecho chrome; parent CTA can click the anchor. */
  hideChrome?: boolean;
  className?: string;
};

/**
 * Peecho Print Button (WP plugin pattern): one script per page +
 * `<a class="peecho-print-button">` with data-src for hosted originals.
 */
export default function PeechoPrintButton({
  src,
  thumbnail,
  title,
  widthMm,
  heightMm,
  currency = "USD",
  hideChrome = true,
  className
}: PeechoPrintButtonProps) {
  const scriptId = peechoButtonScriptId();
  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  const reactId = useId();

  useEffect(() => {
    if (scriptId) ensurePeechoScript(scriptId);
  }, [scriptId]);

  // Remount key when attrs change so Peecho can re-bind if needed.
  const key = `${src}|${widthMm}x${heightMm}|${reactId}`;

  if (!scriptId) {
    return (
      <p className="m-0 text-sm text-olive dark:text-dark-muted">
        Set <code className="text-xs">NEXT_PUBLIC_PEECHO_BUTTON_SCRIPT_ID</code> to enable
        Peecho checkout.
      </p>
    );
  }

  return (
    <a
      key={key}
      ref={anchorRef}
      title={title || "Order print"}
      href="https://www.peecho.com/"
      className={`peecho-print-button ${hideChrome ? "sr-only" : ""} ${className || ""}`}
      data-filetype="jpg"
      data-width={String(widthMm)}
      data-height={String(heightMm)}
      data-pages="1"
      data-src={src}
      data-thumbnail={thumbnail || src}
      data-title={title || "Photo print"}
      data-currency={currency}
      data-style={hideChrome ? "false" : undefined}
      data-theme="blue"
    >
      Order print
    </a>
  );
}

/** Programmatically open Peecho checkout via the hidden Print Button. */
export function clickPeechoPrintButton(container: HTMLElement | null) {
  const anchor = container?.querySelector<HTMLAnchorElement>("a.peecho-print-button");
  if (!anchor) return false;
  anchor.click();
  return true;
}
