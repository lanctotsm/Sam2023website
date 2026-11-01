import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests inside the window and blocks the next one", () => {
    expect(rateLimit("search:1", 2, 1000, 0)).toBe(true);
    expect(rateLimit("search:1", 2, 1000, 10)).toBe(true);
    expect(rateLimit("search:1", 2, 1000, 20)).toBe(false);
  });

  it("resets after the window elapses", () => {
    expect(rateLimit("auth:1", 1, 1000, 0)).toBe(true);
    expect(rateLimit("auth:1", 1, 1000, 999)).toBe(false);
    expect(rateLimit("auth:1", 1, 1000, 1000)).toBe(true);
  });
});
