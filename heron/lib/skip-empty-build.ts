import { connection } from "next/server";

/**
 * GitHub Actions builds the standalone app without the Lightsail database.
 * Prerendering posts and albums there would freeze an empty snapshot into the
 * route cache. Bail out of that build-time render; the server renders against
 * the real file on the first request, and writes call revalidatePath.
 */
export function shouldSkipEmptyProductionBuild(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NEXT_PHASE === "phase-production-build" && !env.CMS_DB_PATH;
}

export async function skipEmptyProductionBuild(): Promise<void> {
  if (shouldSkipEmptyProductionBuild()) {
    await connection();
  }
}
