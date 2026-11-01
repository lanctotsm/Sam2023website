"use client";

import { Toaster } from "sonner";
import { DialogProvider } from "@/components/ui/DialogProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DialogProvider>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </DialogProvider>
  );
}
