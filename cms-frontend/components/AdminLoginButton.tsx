"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminLoginButton() {
  const [loading, setLoading] = useState(false);

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

  return (
    <button className="secondary" onClick={handleLogin} disabled={loading}>
      {loading ? "Redirecting..." : "Log in with Google"}
    </button>
  );
}
