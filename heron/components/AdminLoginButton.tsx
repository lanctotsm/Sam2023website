"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

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
        await signIn("credentials", { email, redirect: false });
      }
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
    return <span className="muted">...</span>;
  }

  // User is logged in - show user info and logout
  if (session?.user) {
    return (
      <div className="auth-status">
        <span className="user-email">{userEmail}</span>
        <button className="secondary small" onClick={handleLogout} disabled={loading}>
          {loading ? "..." : "Log out"}
        </button>
      </div>
    );
  }

  // User is not logged in - show login buttons
  return (
    <div className="auth-buttons">
      {devLoginEnabled && (
        <button className="secondary small" onClick={handleDevLogin} disabled={loading}>
          {loading ? "..." : "Dev login"}
        </button>
      )}
      <button className="secondary small" onClick={handleLogin} disabled={loading}>
        {loading ? "..." : "Log in"}
      </button>
    </div>
  );
}
