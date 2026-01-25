"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface User {
  id: number;
  email: string;
}

export default function AdminLoginButton() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const devLoginEnabled =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await apiFetch<{ user: User }>("/auth/status");
        setUser(result.user);
      } catch {
        // Not authenticated
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await apiFetch<{ auth_url: string }>("/auth/login", {
        method: "POST"
      });
      window.location.href = result.auth_url;
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/dev-login", { method: "POST" });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return <span className="muted">...</span>;
  }

  // User is logged in - show user info and logout
  if (user) {
    return (
      <div className="auth-status">
        <span className="user-email">{user.email}</span>
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
