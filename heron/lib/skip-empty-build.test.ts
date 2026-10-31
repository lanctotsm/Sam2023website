import { describe, expect, it } from "vitest";
import { shouldSkipEmptyProductionBuild } from "./skip-empty-build";

describe("shouldSkipEmptyProductionBuild", () => {
  it("skips only a production build that has no database path", () => {
    expect(shouldSkipEmptyProductionBuild({
      NEXT_PHASE: "phase-production-build"
    })).toBe(true);
    expect(shouldSkipEmptyProductionBuild({
      NEXT_PHASE: "phase-production-build",
      CMS_DB_PATH: "/var/lib/heron-cms/data/cms.db"
    })).toBe(false);
    expect(shouldSkipEmptyProductionBuild({
      CMS_DB_PATH: ""
    })).toBe(false);
  });
});
