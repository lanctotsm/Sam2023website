import { describe, it, expect, vi } from "vitest";
import {
  detectImageFormat,
  parseNovaAltResponse,
  generateAltTextFromBytes
} from "./generate-image-alt";

describe("detectImageFormat", () => {
  it("maps common types and extensions", () => {
    expect(detectImageFormat("image/png")).toBe("png");
    expect(detectImageFormat("uploads/1.webp")).toBe("webp");
    expect(detectImageFormat("image/gif")).toBe("gif");
    expect(detectImageFormat("image/jpeg")).toBe("jpeg");
    expect(detectImageFormat("uploads/1-large.jpg")).toBe("jpeg");
  });
});

describe("parseNovaAltResponse", () => {
  it("extracts text from Nova output shape", () => {
    expect(
      parseNovaAltResponse({
        output: {
          message: {
            content: [{ text: "  A brick building facade.  " }]
          }
        }
      })
    ).toBe("A brick building facade.");
  });

  it("strips wrapping quotes", () => {
    expect(
      parseNovaAltResponse({
        output: { message: { content: [{ text: '"Quoted alt"' }] } }
      })
    ).toBe("Quoted alt");
  });

  it("throws when empty", () => {
    expect(() =>
      parseNovaAltResponse({ output: { message: { content: [{ text: "  " }] } } })
    ).toThrow(/empty/i);
  });
});

describe("generateAltTextFromBytes", () => {
  it("builds a request and returns parsed alt via inject invoke", async () => {
    const invoke = vi.fn(async (body: unknown) => {
      const b = body as {
        messages: Array<{ content: Array<{ image?: { format: string }; text?: string }> }>;
      };
      expect(b.messages[0].content.some((c) => c.image?.format === "jpeg")).toBe(true);
      return {
        output: { message: { content: [{ text: "People outside a restaurant." }] } }
      };
    });

    const alt = await generateAltTextFromBytes({
      bytes: Buffer.from("fake-jpeg"),
      format: "jpeg",
      invoke
    });
    expect(alt).toBe("People outside a restaurant.");
    expect(invoke).toHaveBeenCalledOnce();
  });
});
