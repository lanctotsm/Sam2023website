"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

export default function AdminLoginButton() {
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();

  const devLoginEnabled =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const userEmail = session?.user?.email || "";

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google");
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const email = window.prompt("Enter admin email for local dev:", "dev@local");
      if (email) {
        const res = await signIn("credentials", { email, redirect: false });
        if (res?.error) toast.error(res.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <span className="text-olive dark:text-dark-muted">...</span>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-olive-dark dark:text-dark-muted">{userEmail}</span>
        <button
          className="rounded-lg border border-chestnut bg-transparent px-3 py-1.5 text-sm font-semibold text-chestnut transition-all hover:opacity-90 disabled:opacity-60 dark:border-dark-text dark:text-dark-text"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "..." : "Log out"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {devLoginEnabled && (
        <button
          className="rounded-lg border border-chestnut bg-transparent px-3 py-1.5 text-sm font-semibold text-chestnut transition-all hover:opacity-90 disabled:opacity-60 dark:border-dark-text dark:text-dark-text"
          onClick={handleDevLogin}
          disabled={loading}
        >
          {loading ? "..." : "Dev login"}
        </button>
      )}
      <button
        className="rounded-lg border border-chestnut bg-transparent px-3 py-1.5 text-sm font-semibold text-chestnut transition-all hover:opacity-90 disabled:opacity-60 dark:border-dark-text dark:text-dark-text"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? "..." : "Log in"}
      </button>
    </div>
  );
}
