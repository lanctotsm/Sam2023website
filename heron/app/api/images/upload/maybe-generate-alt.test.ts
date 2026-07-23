import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/settings", () => ({
  getSetting: vi.fn()
}));

vi.mock("@/lib/ai/generate-image-alt", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/generate-image-alt")>(
    "@/lib/ai/generate-image-alt"
  );
  return {
    ...actual,
    generateAltTextFromBytes: vi.fn()
  };
});

import { getSetting } from "@/services/settings";
import { generateAltTextFromBytes } from "@/lib/ai/generate-image-alt";
import { maybeGenerateAltText } from "./maybe-generate-alt";

describe("maybeGenerateAltText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns provided alt without calling the AI helper", async () => {
    const alt = await maybeGenerateAltText("Manual alt", Buffer.from("x"), "image/jpeg");
    expect(alt).toBe("Manual alt");
    expect(getSetting).not.toHaveBeenCalled();
    expect(generateAltTextFromBytes).not.toHaveBeenCalled();
  });

  it("skips generation when setting is off", async () => {
    vi.mocked(getSetting).mockResolvedValue("false");
    const alt = await maybeGenerateAltText("", Buffer.from("x"), "image/jpeg");
    expect(alt).toBe("");
    expect(generateAltTextFromBytes).not.toHaveBeenCalled();
  });

  it("generates when setting is on and alt is empty", async () => {
    vi.mocked(getSetting).mockResolvedValue("true");
    vi.mocked(generateAltTextFromBytes).mockResolvedValue("AI description");
    const alt = await maybeGenerateAltText("", Buffer.from("x"), "image/jpeg");
    expect(alt).toBe("AI description");
    expect(generateAltTextFromBytes).toHaveBeenCalledOnce();
  });

  it("returns empty on generation failure", async () => {
    vi.mocked(getSetting).mockResolvedValue("true");
    vi.mocked(generateAltTextFromBytes).mockRejectedValue(new Error("boom"));
    const alt = await maybeGenerateAltText("", Buffer.from("x"), "image/jpeg");
    expect(alt).toBe("");
  });
});
