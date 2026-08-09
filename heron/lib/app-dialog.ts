export type DialogVariant = "default" | "danger";

export type AlertOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
};

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
};

export type NormalizedAlert = {
  title: string;
  message: string;
  confirmLabel: string;
};

export type NormalizedConfirm = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: DialogVariant;
};

export function normalizeAlertInput(input: string | AlertOptions): NormalizedAlert {
  if (typeof input === "string") {
    return {
      title: "Notice",
      message: input,
      confirmLabel: "OK"
    };
  }

  return {
    title: input.title?.trim() || "Notice",
    message: input.message,
    confirmLabel: input.confirmLabel?.trim() || "OK"
  };
}

export function normalizeConfirmInput(input: string | ConfirmOptions): NormalizedConfirm {
  if (typeof input === "string") {
    return {
      title: "Please confirm",
      message: input,
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      variant: "default"
    };
  }

  return {
    title: input.title?.trim() || "Please confirm",
    message: input.message,
    confirmLabel: input.confirmLabel?.trim() || "Confirm",
    cancelLabel: input.cancelLabel?.trim() || "Cancel",
    variant: input.variant ?? "default"
  };
}
