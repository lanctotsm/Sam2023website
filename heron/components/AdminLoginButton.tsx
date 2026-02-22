"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

interface AdminLoginButtonProps {
  isAdminEmail?: boolean;
  isDev?: boolean;
}

export default function AdminLoginButton({ isAdminEmail, isDev }: AdminLoginButtonProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/admin" });
  };

  const handleDevLogin = (email: string) => {
    setIsLoading(true);
    signIn("credentials", {
      email,
      callbackUrl: "/admin",
    }).catch((err) => {
      console.error(err);
      setIsLoading(false);
    });
  };

  return (
    <section className="login-card" aria-labelledby="login-title">
      <header>
        <h1 id="login-title" className="login-card__title">Admin Login</h1>
        <p className="login-card__text">
          Sign in to manage your blog posts and photo albums.
        </p>
      </header>

      {error && (
        <div role="alert" className="login-card__error">
          {error === "AccessDenied"
            ? "You are not authorized to access the admin area."
            : "An error occurred during sign in. Please try again."}
        </div>
      )}

      <div className="login-card__actions">
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="login-card__button login-card__button--google"
          aria-label="Sign in with Google"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1.2-1 2.2-2 2.9v2.4h3.2c1.9-1.7 3-4.3 3-7.1z" fill="#4285F4" />
            <path d="M10 20c2.7 0 5-1 6.6-2.6l-3.2-2.4c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H1.2v2.5C2.9 17.7 6.2 20 10 20z" fill="#34A853" />
            <path d="M4.4 11.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V5.7H1.2C.4 7.3 0 9.1 0 11s.4 3.7 1.2 5.3l3.2-1.5c-.8-.7-1.3-1.7-1.3-3z" fill="#FBBC05" />
            <path d="M10 3.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9C15 1 12.7 0 10 0 6.2 0 2.9 2.3 1.2 5.7l3.2 2.5c.8-2.4 3-4.3 5.6-4.3z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {isDev && (
          <button
            onClick={() => handleDevLogin("dev@local")}
            disabled={isLoading}
            className="login-card__button login-card__button--dev"
          >
            Developer Mode: Bypass Login
          </button>
        )}
      </div>

      {isAdminEmail && !isDev && (
        <p className="login-card__text">
          Note: Only <strong>{isAdminEmail}</strong> is allowed to access the admin area.
        </p>
      )}
    </section>
  );
}
