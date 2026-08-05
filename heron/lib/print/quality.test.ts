import { describe, expect, it } from "vitest";
import {
  BLOCK_DPI,
  WARN_DPI,
  dpiForPrint,
  filterSizesForImage,
  inchesToMm,
  maxPrintLongEdgeInches,
  printSizeMmForImage,
  qualityForDpi,
  qualitySummary
} from "./quality";
import { PRINT_SIZES } from "./catalog";

describe("print quality", () => {
  it("converts inches to mm", () => {
    expect(inchesToMm(8)).toBe(203);
    expect(inchesToMm(10)).toBe(254);
  });

  it("computes DPI from long edge", () => {
    // 1200×800 landscape at 8×10 → long edge 10" → 1200/10 = 120 DPI
    expect(dpiForPrint(1200, 800, 8, 10)).toBe(120);
  });

  it("classifies dpi thresholds", () => {
    expect(qualityForDpi(BLOCK_DPI - 1)).toBe("block");
    expect(qualityForDpi(BLOCK_DPI)).toBe("warn");
    expect(qualityForDpi(WARN_DPI - 1)).toBe("warn");
    expect(qualityForDpi(WARN_DPI)).toBe("ok");
  });

  it("filters catalog for a small photo", () => {
    // 1200×800: 4×6 ok (200dpi), 5×7 warn (~171), 8×10 warn (120), 11×14 block (~86)
    const options = filterSizesForImage(1200, 800, PRINT_SIZES);
    const byId = Object.fromEntries(options.map((o) => [o.id, o]));
    expect(byId["4x6"].quality).toBe("ok");
    expect(byId["5x7"].quality).toBe("ok"); // 1200/7 ≈ 171 >= 150
    expect(byId["8x10"].quality).toBe("warn");
    expect(byId["11x14"].quality).toBe("block");
    expect(byId["16x20"].quality).toBe("block");
    expect(byId["11x14"].reason).toMatch(/1200×800/);
  });

  it("orients mm for landscape and portrait", () => {
    expect(printSizeMmForImage(1200, 800, 8, 10)).toEqual({
      widthMm: inchesToMm(10),
      heightMm: inchesToMm(8)
    });
    expect(printSizeMmForImage(800, 1200, 8, 10)).toEqual({
      widthMm: inchesToMm(8),
      heightMm: inchesToMm(10)
    });
  });

  it("summarizes max print size", () => {
    expect(maxPrintLongEdgeInches(1200, 800, WARN_DPI)).toBe(8);
    expect(qualitySummary(1200, 800)).toMatch(/1200×800/);
    expect(qualitySummary(null, null)).toMatch(/unknown/i);
  });

  it("warns when dimensions missing", () => {
    const options = filterSizesForImage(null, null, PRINT_SIZES);
    expect(options.every((o) => o.quality === "warn")).toBe(true);
  });
});
