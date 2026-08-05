"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildLargeUrl, buildOriginalUrl } from "@/lib/images";
import type { Image as AlbumImage } from "@/lib/api";
import {
  FRAME_STYLES,
  PRINT_SIZES,
  peechoButtonScriptId,
  type FrameStyleId
} from "@/lib/print/catalog";
import {
  filterSizesForImage,
  printSizeMmForImage,
  qualitySummary,
  type SizedOption
} from "@/lib/print/quality";
import WallPreview from "@/components/print/WallPreview";
import PeechoPrintButton, { openPeechoCheckout } from "@/components/print/PeechoPrintButton";

type PrintConfiguratorProps = {
  image: AlbumImage;
  onClose: () => void;
};

export default function PrintConfigurator({ image, onClose }: PrintConfiguratorProps) {
  const handoffRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [peechoReady, setPeechoReady] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const onPeechoReady = useCallback((ready: boolean) => {
    setPeechoReady(ready);
  }, []);

  const sizes = useMemo(
    () => filterSizesForImage(image.width, image.height, PRINT_SIZES),
    [image.width, image.height]
  );

  const firstSelectable = sizes.find((s) => s.quality !== "block") ?? sizes[0];
  const [sizeId, setSizeId] = useState(firstSelectable?.id ?? "4x6");
  const [frameId, setFrameId] = useState<FrameStyleId>("black");

  const selected: SizedOption =
    sizes.find((s) => s.id === sizeId && s.quality !== "block") ??
    firstSelectable ??
    sizes[0];

  const mm = printSizeMmForImage(
    image.width ?? selected.longIn,
    image.height ?? selected.shortIn,
    selected.shortIn,
    selected.longIn
  );

  const previewUrl = buildLargeUrl(image);
  const originalUrl = buildOriginalUrl(image);
  const title = image.name || image.caption || `Photo ${image.id}`;
  const blocked = selected.quality === "block";
  const hasScript = Boolean(peechoButtonScriptId());
  const canCheckout = !blocked && hasScript && peechoReady;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const onCheckout = () => {
    if (!canCheckout) return;
    setCheckoutError(null);
    const ok = openPeechoCheckout(handoffRef.current);
    if (!ok) {
      setCheckoutError("Peecho checkout is still loading. Try again in a moment.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-configurator-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[95svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl dark:bg-dark-surface sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-desert-tan-dark px-4 py-3 dark:border-dark-muted">
          <h2
            id="print-configurator-title"
            className="m-0 text-lg font-semibold text-chestnut dark:text-dark-text"
          >
            Order a print
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-desert-tan-dark px-3 py-1.5 text-sm text-chestnut hover:bg-desert-tan dark:border-dark-muted dark:text-dark-text dark:hover:bg-dark-bg"
          >
            Close
          </button>
        </header>

        <div className="grid gap-4 overflow-y-auto p-4 sm:grid-cols-[1.2fr_1fr]">
          <WallPreview
            imageUrl={previewUrl}
            alt={image.alt_text || title}
            size={selected}
            frameId={frameId}
            photoWidth={image.width}
            photoHeight={image.height}
          />

          <div className="flex flex-col gap-4">
            <p className="m-0 text-sm text-olive dark:text-dark-muted">
              {qualitySummary(image.width, image.height)}
            </p>

            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2 text-sm font-medium text-chestnut dark:text-dark-text">
                Size
              </legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const disabled = size.quality === "block";
                  const active = size.id === selected.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      disabled={disabled}
                      title={size.reason}
                      onClick={() => setSizeId(size.id)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        active
                          ? "border-caramel bg-caramel/20 text-chestnut dark:text-dark-text"
                          : "border-desert-tan-dark bg-white text-chestnut dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text"
                      } ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-caramel"}`}
                    >
                      {size.label}
                      {size.quality === "warn" ? " *" : ""}
                    </button>
                  );
                })}
              </div>
              {selected.reason && (
                <p className="mt-2 m-0 text-xs text-olive dark:text-dark-muted">{selected.reason}</p>
              )}
            </fieldset>

            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2 text-sm font-medium text-chestnut dark:text-dark-text">
                Frame preview
              </legend>
              <div className="flex flex-wrap gap-2">
                {FRAME_STYLES.map((frame) => {
                  const active = frame.id === frameId;
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => setFrameId(frame.id)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        active
                          ? "border-caramel bg-caramel/20 text-chestnut dark:text-dark-text"
                          : "border-desert-tan-dark bg-white text-chestnut hover:border-caramel dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text"
                      }`}
                    >
                      {frame.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 m-0 text-xs text-olive dark:text-dark-muted">
                Frame style is a preview on this site. Peecho checkout may offer its own product
                options.
              </p>
            </fieldset>

            <div ref={handoffRef} className="mt-auto flex flex-col gap-2">
              <PeechoPrintButton
                src={originalUrl}
                thumbnail={previewUrl}
                title={title}
                widthMm={mm.widthMm}
                heightMm={mm.heightMm}
                hideChrome
                onReadyChange={onPeechoReady}
              />
              <button
                type="button"
                disabled={!canCheckout}
                onClick={onCheckout}
                className="rounded-lg bg-chestnut px-4 py-3 text-sm font-medium text-desert-tan disabled:cursor-not-allowed disabled:opacity-50 dark:bg-caramel dark:text-chestnut"
              >
                {hasScript && !peechoReady ? "Loading Peecho…" : "Checkout with Peecho"}
              </button>
              {!hasScript && (
                <p className="m-0 text-xs text-olive dark:text-dark-muted">
                  Add your Peecho Button Key to{" "}
                  <code className="text-[0.7rem]">NEXT_PUBLIC_PEECHO_BUTTON_SCRIPT_ID</code>.
                </p>
              )}
              {checkoutError && (
                <p className="m-0 text-xs text-red-700 dark:text-red-300" role="alert">
                  {checkoutError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
