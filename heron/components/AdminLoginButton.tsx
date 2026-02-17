"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

// Official Google "G" logo from Google's CDN (Firebase Auth / Identity)
const GOOGLE_LOGO_SRC =
  "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";

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
      const callbackUrl =
        (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("callbackUrl")) || "/admin";
      await signIn("google", { callbackUrl });
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
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="inline-flex items-center justify-center gap-3 rounded-md border border-[#747775] bg-white px-4 py-2.5 text-[14px]/[20px] font-medium text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f8f9fa] disabled:opacity-60 dark:border-[#8e918f] dark:bg-[#131314] dark:text-[#e3e3e3] dark:hover:bg-[#2d2d2d]"
        style={{ fontFamily: "Roboto, sans-serif" }}
      >
        <img
          src={GOOGLE_LOGO_SRC}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 shrink-0"
        />
        {loading ? "Signing in…" : "Sign in with Google"}
      </button>
      {devLoginEnabled && (
        <button
          className="rounded-lg border border-chestnut bg-transparent px-3 py-1.5 text-sm font-semibold text-chestnut transition-all hover:opacity-90 disabled:opacity-60 dark:border-dark-text dark:text-dark-text"
          onClick={handleDevLogin}
          disabled={loading}
        >
          {loading ? "..." : "Sign in with Dev Login"}
        </button>
      )}
    </div>
  );
}
