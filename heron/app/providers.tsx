"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { DialogProvider } from "@/components/ui/DialogProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DialogProvider>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </DialogProvider>
    </SessionProvider>
  );
}
