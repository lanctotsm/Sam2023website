"use client";

import { useEffect, useRef } from "react";
import { peechoButtonScriptId, peechoFiletypeFromUrl } from "@/lib/print/catalog";

const SCRIPT_ATTR = "data-peecho-button-script";

type PeechoGlobal = {
  attach?: () => void;
  send?: (origin: HTMLElement) => boolean;
};

declare global {
  interface Window {
    peecho?: PeechoGlobal;
  }
}

function ensurePeechoScript(scriptId: string): Promise<void> {
  if (typeof document === "undefined" || !scriptId) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[${SCRIPT_ATTR}]`);
  if (existing) {
    if (window.peecho?.attach) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Peecho script failed")), {
        once: true
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://d3aln0nj58oevo.cloudfront.net/button/script/${encodeURIComponent(scriptId)}.js`;
    script.setAttribute(SCRIPT_ATTR, "1");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Peecho script failed to load"));
    document.body.appendChild(script);
  });
}

export type PeechoPrintButtonProps = {
  src: string;
  thumbnail?: string;
  title?: string;
  widthMm: number;
  heightMm: number;
  currency?: string;
  /** When true, leave custom link text (Peecho skips chrome rewrite for non-keyword labels). */
  hideChrome?: boolean;
  className?: string;
  onReadyChange?: (ready: boolean) => void;
};

/**
 * Peecho Print Button (WP plugin pattern): one script per page +
 * `<a class="peecho-print-button">` with data-src for hosted originals.
 *
 * Peecho binds `mouseup` → `window.peecho.send(el)` and reads data-* at send time.
 * Prefer `openPeechoCheckout` over `HTMLElement.click()` (click alone does not checkout).
 */
export default function PeechoPrintButton({
  src,
  thumbnail,
  title,
  widthMm,
  heightMm,
  currency = "USD",
  hideChrome = true,
  className,
  onReadyChange
}: PeechoPrintButtonProps) {
  const scriptId = peechoButtonScriptId();
  const onReadyRef = useRef(onReadyChange);

  useEffect(() => {
    onReadyRef.current = onReadyChange;
  }, [onReadyChange]);

  useEffect(() => {
    if (!scriptId) {
      queueMicrotask(() => onReadyRef.current?.(false));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => onReadyRef.current?.(false));

    ensurePeechoScript(scriptId)
      .then(() => {
        if (cancelled) return;
        window.peecho?.attach?.();
        onReadyRef.current?.(true);
      })
      .catch(() => {
        if (!cancelled) onReadyRef.current?.(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scriptId]);

  // Re-scan after size/src attrs change (script only auto-attaches once on first load).
  useEffect(() => {
    if (!scriptId) return;
    window.peecho?.attach?.();
  }, [scriptId, src, widthMm, heightMm, thumbnail, title]);

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
      title={title || "Order print"}
      href="https://www.peecho.com/"
      className={`peecho-print-button ${hideChrome ? "sr-only" : ""} ${className || ""}`}
      data-filetype={peechoFiletypeFromUrl(src)}
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

/**
 * Open Peecho checkout for a Print Button anchor.
 * Uses `window.peecho.send` (attrs read at call time).
 */
export function openPeechoCheckout(container: HTMLElement | null): boolean {
  const anchor = container?.querySelector<HTMLAnchorElement>("a.peecho-print-button");
  if (!anchor) return false;

  const peecho = window.peecho;
  if (typeof peecho?.send === "function") {
    peecho.send(anchor);
    return true;
  }

  // Script not ready — avoid navigating to peecho.com homepage via href.
  return false;
}
