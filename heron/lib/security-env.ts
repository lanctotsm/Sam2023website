const PLACEHOLDER_SECRETS = new Set([
  "",
  "change-me",
  "changeme",
  "secret",
  "password",
  "nextauth-secret"
]);

export function isLocalAuthUrl(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  try {
    const host = new URL(value).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Passwordless dev login is only offered on a loopback site. */
export function isDevCredentialsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.DEV_AUTH_BYPASS === "true" && isLocalAuthUrl(env.NEXTAUTH_URL);
}

/**
 * Fail closed when production is using a placeholder session secret, or when
 * the dev-login bypass is pointed at a public URL.
 */
export function assertProductionAuthConfig(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === "production") {
    const secret = (env.NEXTAUTH_SECRET || "").trim().toLowerCase();
    if (PLACEHOLDER_SECRETS.has(secret)) {
      throw new Error(
        "NEXTAUTH_SECRET is missing or a placeholder. Set a unique secret before starting in production."
      );
    }
  }

  if (env.DEV_AUTH_BYPASS === "true" && !isLocalAuthUrl(env.NEXTAUTH_URL)) {
    throw new Error(
      "DEV_AUTH_BYPASS is enabled but NEXTAUTH_URL is not localhost. Refusing to start."
    );
  }
}
