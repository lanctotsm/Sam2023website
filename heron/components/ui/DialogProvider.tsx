"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import AppDialog, { type AppDialogState } from "@/components/ui/AppDialog";
import {
  normalizeAlertInput,
  normalizeConfirmInput,
  type AlertOptions,
  type ConfirmOptions
} from "@/lib/app-dialog";

type DialogContextValue = {
  alert: (input: string | AlertOptions) => Promise<void>;
  confirm: (input: string | ConfirmOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

type Resolver =
  | { mode: "alert"; resolve: (value: void) => void }
  | { mode: "confirm"; resolve: (value: boolean) => void };

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<AppDialogState | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  const closeDialog = useCallback(() => {
    setDialog(null);
    resolverRef.current = null;
  }, []);

  const alert = useCallback((input: string | AlertOptions) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = { mode: "alert", resolve };
      setDialog({
        mode: "alert",
        options: normalizeAlertInput(input)
      });
    });
  }, []);

  const confirm = useCallback((input: string | ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = { mode: "confirm", resolve };
      setDialog({
        mode: "confirm",
        options: normalizeConfirmInput(input)
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const current = resolverRef.current;
    closeDialog();
    if (!current) return;
    if (current.mode === "alert") {
      current.resolve();
    } else {
      current.resolve(true);
    }
  }, [closeDialog]);

  const handleCancel = useCallback(() => {
    const current = resolverRef.current;
    closeDialog();
    if (current?.mode === "confirm") {
      current.resolve(false);
    }
  }, [closeDialog]);

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog ? (
        <AppDialog dialog={dialog} onConfirm={handleConfirm} onCancel={handleCancel} />
      ) : null}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
