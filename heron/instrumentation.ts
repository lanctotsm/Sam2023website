export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { assertProductionAuthConfig } = await import("@/lib/security-env");
  assertProductionAuthConfig();
}
