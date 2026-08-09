"use client";

import { useEffect, useId, useRef } from "react";
import type { DialogVariant, NormalizedAlert, NormalizedConfirm } from "@/lib/app-dialog";

type AlertDialogState = {
  mode: "alert";
  options: NormalizedAlert;
};

type ConfirmDialogState = {
  mode: "confirm";
  options: NormalizedConfirm;
};

export type AppDialogState = AlertDialogState | ConfirmDialogState;

type Props = {
  dialog: AppDialogState;
  onConfirm: () => void;
  onCancel: () => void;
};

const confirmButtonClass = (variant: DialogVariant) =>
  variant === "danger"
    ? "rounded-lg bg-copper px-4 py-2.5 text-white transition hover:bg-copper/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper dark:bg-copper dark:hover:bg-copper/80"
    : "rounded-lg bg-chestnut px-4 py-2.5 text-desert-tan transition hover:bg-chestnut-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chestnut dark:text-dark-text";

export default function AppDialog({ dialog, onConfirm, onCancel }: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const isConfirm = dialog.mode === "confirm";
  const variant = isConfirm ? dialog.options.variant : "default";

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isConfirm) {
          onCancel();
        } else {
          onConfirm();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [isConfirm, onCancel, onConfirm]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          if (isConfirm) {
            onCancel();
          } else {
            onConfirm();
          }
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl border border-desert-tan-dark bg-white p-6 shadow-2xl dark:border-dark-muted dark:bg-dark-surface"
      >
        <h2 id={titleId} className="m-0 text-xl font-semibold text-chestnut dark:text-dark-text">
          {dialog.options.title}
        </h2>
        <p
          id={descriptionId}
          className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-olive dark:text-dark-muted"
        >
          {dialog.options.message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {isConfirm ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-chestnut bg-transparent px-4 py-2.5 text-chestnut transition hover:bg-chestnut/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chestnut dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-bg"
            >
              {dialog.options.cancelLabel}
            </button>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={confirmButtonClass(variant)}
          >
            {dialog.options.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
