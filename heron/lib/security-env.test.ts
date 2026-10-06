import { describe, expect, it } from "vitest";
import { assertProductionAuthConfig, isDevCredentialsEnabled, isLocalAuthUrl } from "./security-env";

describe("isLocalAuthUrl", () => {
  it("accepts loopback hosts only", () => {
    expect(isLocalAuthUrl("http://localhost:3000")).toBe(true);
    expect(isLocalAuthUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalAuthUrl("https://example.com")).toBe(false);
    expect(isLocalAuthUrl(undefined)).toBe(false);
  });
});

describe("isDevCredentialsEnabled", () => {
  it("requires the bypass flag and a local URL", () => {
    expect(isDevCredentialsEnabled({
      DEV_AUTH_BYPASS: "true",
      NEXTAUTH_URL: "http://127.0.0.1:3000"
    } as NodeJS.ProcessEnv)).toBe(true);
    expect(isDevCredentialsEnabled({
      DEV_AUTH_BYPASS: "true",
      NEXTAUTH_URL: "https://example.com"
    } as NodeJS.ProcessEnv)).toBe(false);
    expect(isDevCredentialsEnabled({
      NEXTAUTH_URL: "http://localhost:3000"
    } as NodeJS.ProcessEnv)).toBe(false);
  });
});

describe("assertProductionAuthConfig", () => {
  it("allows a non-placeholder secret in production", () => {
    expect(() => assertProductionAuthConfig({
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "ci-dummy-secret",
      NEXTAUTH_URL: "http://localhost:3000"
    } as NodeJS.ProcessEnv)).not.toThrow();
  });

  it("rejects a placeholder secret in production", () => {
    expect(() => assertProductionAuthConfig({
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "change-me",
      NEXTAUTH_URL: "https://example.com"
    } as NodeJS.ProcessEnv)).toThrow(/NEXTAUTH_SECRET/);
  });

  it("rejects dev auth bypass on a public URL", () => {
    expect(() => assertProductionAuthConfig({
      NODE_ENV: "development",
      DEV_AUTH_BYPASS: "true",
      NEXTAUTH_URL: "https://example.com"
    } as NodeJS.ProcessEnv)).toThrow(/DEV_AUTH_BYPASS/);
  });

  it("allows dev auth bypass on localhost", () => {
    expect(() => assertProductionAuthConfig({
      NODE_ENV: "development",
      DEV_AUTH_BYPASS: "true",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "change-me"
    } as NodeJS.ProcessEnv)).not.toThrow();
  });
});
