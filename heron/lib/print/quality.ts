/** Print quality / DPI helpers for album originals (JPEG/PNG, not RAW). */

export const WARN_DPI = 150;
export const BLOCK_DPI = 100;

export type PrintSizeInches = {
  id: string;
  label: string;
  /** Short edge in inches */
  shortIn: number;
  /** Long edge in inches */
  longIn: number;
};

export type SizeQuality = "ok" | "warn" | "block";

export type SizedOption = PrintSizeInches & {
  quality: SizeQuality;
  /** Effective DPI for the long edge given this photo */
  dpi: number;
  reason?: string;
};

/** Convert inches to millimeters (Peecho data-width / data-height). */
export function inchesToMm(inches: number): number {
  return Math.round(inches * 25.4);
}

/**
 * Long-edge DPI if printed at the given long edge in inches.
 * Uses the photo's longer pixel dimension against the print's longer side.
 */
export function dpiForPrint(
  pixelWidth: number,
  pixelHeight: number,
  shortIn: number,
  longIn: number
): number {
  const longPx = Math.max(pixelWidth, pixelHeight);
  if (longIn <= 0 || longPx <= 0) return 0;
  return longPx / longIn;
}

export function qualityForDpi(dpi: number): SizeQuality {
  if (dpi < BLOCK_DPI) return "block";
  if (dpi < WARN_DPI) return "warn";
  return "ok";
}

export function maxPrintLongEdgeInches(
  pixelWidth: number,
  pixelHeight: number,
  minDpi: number = WARN_DPI
): number {
  const longPx = Math.max(pixelWidth, pixelHeight);
  if (minDpi <= 0 || longPx <= 0) return 0;
  return Math.round((longPx / minDpi) * 10) / 10;
}

/**
 * Orient print dimensions to match the photo (landscape vs portrait).
 * Returns widthMm × heightMm for Peecho button attrs.
 */
export function printSizeMmForImage(
  pixelWidth: number,
  pixelHeight: number,
  shortIn: number,
  longIn: number
): { widthMm: number; heightMm: number } {
  const landscape = pixelWidth >= pixelHeight;
  if (landscape) {
    return { widthMm: inchesToMm(longIn), heightMm: inchesToMm(shortIn) };
  }
  return { widthMm: inchesToMm(shortIn), heightMm: inchesToMm(longIn) };
}

export function filterSizesForImage(
  pixelWidth: number | null | undefined,
  pixelHeight: number | null | undefined,
  catalog: PrintSizeInches[]
): SizedOption[] {
  const w = pixelWidth && pixelWidth > 0 ? pixelWidth : 0;
  const h = pixelHeight && pixelHeight > 0 ? pixelHeight : 0;
  const hasDims = w > 0 && h > 0;

  return catalog.map((size) => {
    if (!hasDims) {
      return {
        ...size,
        quality: "warn" as const,
        dpi: 0,
        reason: "Photo dimensions unknown — print sharpness cannot be verified."
      };
    }
    const dpi = dpiForPrint(w, h, size.shortIn, size.longIn);
    const quality = qualityForDpi(dpi);
    let reason: string | undefined;
    if (quality === "block") {
      reason = `Photo is ${w}×${h}px — too soft for ${size.label} (needs ~${Math.ceil(size.longIn * BLOCK_DPI)}px on the long edge).`;
    } else if (quality === "warn") {
      reason = `Photo is ${w}×${h}px — ${size.label} may look soft (below ${WARN_DPI} DPI).`;
    }
    return { ...size, quality, dpi: Math.round(dpi), reason };
  });
}

export function qualitySummary(
  pixelWidth: number | null | undefined,
  pixelHeight: number | null | undefined
): string {
  const w = pixelWidth && pixelWidth > 0 ? pixelWidth : 0;
  const h = pixelHeight && pixelHeight > 0 ? pixelHeight : 0;
  if (!w || !h) {
    return "Original pixel size unknown for this photo.";
  }
  const maxIn = maxPrintLongEdgeInches(w, h, WARN_DPI);
  return `Photo is ${w}×${h}px — sharp prints up to about ${maxIn}" on the long edge at ${WARN_DPI} DPI.`;
}
