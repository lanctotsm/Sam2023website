import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASPECT,
  aspectOf,
  computeJustifiedLayout,
  type LayoutInput
} from "./justifiedLayout";

const landscape: LayoutInput = { width: 3000, height: 2000 }; // 1.5
const portrait: LayoutInput = { width: 2000, height: 3000 }; // 0.667
const square: LayoutInput = { width: 1000, height: 1000 }; // 1
const panorama: LayoutInput = { width: 6000, height: 1000 }; // 6

function repeat(item: LayoutInput, count: number): LayoutInput[] {
  return Array.from({ length: count }, () => item);
}

describe("aspectOf", () => {
  it("computes width over height", () => {
    expect(aspectOf(landscape)).toBeCloseTo(1.5);
    expect(aspectOf(portrait)).toBeCloseTo(2 / 3);
    expect(aspectOf(square)).toBe(1);
  });

  it("falls back to the default for missing or invalid dimensions", () => {
    expect(aspectOf({})).toBe(DEFAULT_ASPECT);
    expect(aspectOf({ width: null, height: null })).toBe(DEFAULT_ASPECT);
    expect(aspectOf({ width: 100, height: null })).toBe(DEFAULT_ASPECT);
    expect(aspectOf({ width: 0, height: 100 })).toBe(DEFAULT_ASPECT);
    expect(aspectOf({ width: -5, height: 100 })).toBe(DEFAULT_ASPECT);
    expect(aspectOf({ width: Number.NaN, height: 100 })).toBe(DEFAULT_ASPECT);
    expect(aspectOf({ width: Number.POSITIVE_INFINITY, height: 100 })).toBe(DEFAULT_ASPECT);
  });
});

describe("computeJustifiedLayout", () => {
  const desktop = { containerWidth: 1040, targetRowHeight: 280, gap: 8 };

  it("returns an empty layout for no items", () => {
    expect(computeJustifiedLayout([], desktop)).toEqual({
      boxes: [],
      containerHeight: 0,
      rowCount: 0
    });
  });

  it("returns an empty layout for a non-positive container width", () => {
    expect(computeJustifiedLayout(repeat(landscape, 5), { ...desktop, containerWidth: 0 }).boxes)
      .toHaveLength(0);
    expect(computeJustifiedLayout(repeat(landscape, 5), { ...desktop, containerWidth: -100 }).boxes)
      .toHaveLength(0);
  });

  it("returns an empty layout for a non-positive target row height", () => {
    expect(computeJustifiedLayout(repeat(landscape, 5), { ...desktop, targetRowHeight: 0 }).boxes)
      .toHaveLength(0);
  });

  it("emits exactly one box per input, in order", () => {
    const result = computeJustifiedLayout(repeat(landscape, 11), desktop);
    expect(result.boxes).toHaveLength(11);
    expect(result.boxes.map((b) => b.index)).toEqual([...Array(11).keys()]);
  });

  it("makes every full row span the container width exactly", () => {
    const result = computeJustifiedLayout(
      [landscape, portrait, square, landscape, panorama, portrait, square, landscape, landscape],
      desktop
    );

    const rowIndexes = [...new Set(result.boxes.map((b) => b.row))];
    const lastRow = rowIndexes[rowIndexes.length - 1];

    for (const row of rowIndexes) {
      if (row === lastRow) continue;
      const inRow = result.boxes.filter((b) => b.row === row);
      const right = inRow[inRow.length - 1].left + inRow[inRow.length - 1].width;
      expect(right).toBe(desktop.containerWidth);
    }
  });

  it("never lets a box exceed the container width", () => {
    const result = computeJustifiedLayout(
      [panorama, landscape, portrait, square, panorama, landscape],
      desktop
    );
    for (const box of result.boxes) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.left + box.width).toBeLessThanOrEqual(desktop.containerWidth);
    }
  });

  it("gives every box in a row the same height and top", () => {
    const result = computeJustifiedLayout(
      [landscape, portrait, square, landscape, panorama, portrait, square, landscape],
      desktop
    );
    for (const row of new Set(result.boxes.map((b) => b.row))) {
      const inRow = result.boxes.filter((b) => b.row === row);
      const heights = new Set(inRow.map((b) => b.height));
      const tops = new Set(inRow.map((b) => b.top));
      expect(heights.size).toBe(1);
      expect(tops.size).toBe(1);
    }
  });

  it("separates adjacent boxes in a row by the gap", () => {
    const result = computeJustifiedLayout(repeat(landscape, 9), desktop);
    for (const row of new Set(result.boxes.map((b) => b.row))) {
      const inRow = result.boxes.filter((b) => b.row === row);
      for (let i = 1; i < inRow.length; i++) {
        const previousRight = inRow[i - 1].left + inRow[i - 1].width;
        expect(inRow[i].left - previousRight).toBe(desktop.gap);
      }
    }
  });

  it("separates rows by the gap and reports the content height", () => {
    const result = computeJustifiedLayout(repeat(landscape, 9), desktop);
    const rows = [...new Set(result.boxes.map((b) => b.row))];
    expect(rows.length).toBeGreaterThan(1);

    for (let i = 1; i < rows.length; i++) {
      const previous = result.boxes.find((b) => b.row === rows[i - 1])!;
      const current = result.boxes.find((b) => b.row === rows[i])!;
      expect(current.top - (previous.top + previous.height)).toBe(desktop.gap);
    }

    const last = result.boxes[result.boxes.length - 1];
    expect(result.containerHeight).toBe(last.top + last.height);
  });

  it("preserves each image's aspect ratio within rounding tolerance", () => {
    const items = [landscape, portrait, square, panorama, landscape, portrait];
    const result = computeJustifiedLayout(items, desktop);
    for (const box of result.boxes) {
      const expected = aspectOf(items[box.index]);
      expect(box.width / box.height).toBeCloseTo(expected, 1);
    }
  });

  it("keeps a short trailing row at the target height instead of stretching it", () => {
    // A 1.5 landscape is 420px at the 280px target, so three fill the 1040px
    // container and the remaining two are left short.
    const result = computeJustifiedLayout(repeat(landscape, 5), desktop);
    const lastRow = Math.max(...result.boxes.map((b) => b.row));
    const trailing = result.boxes.filter((b) => b.row === lastRow);

    expect(trailing).toHaveLength(2);
    for (const box of trailing) {
      expect(box.height).toBe(desktop.targetRowHeight);
    }
    const right = trailing[trailing.length - 1].left + trailing[trailing.length - 1].width;
    expect(right).toBeLessThan(desktop.containerWidth);
  });

  it("keeps a lone trailing image at the target height", () => {
    // Three landscapes fill row 0, then a portrait (0.667 -> ~187px) is left over.
    const result = computeJustifiedLayout(
      [landscape, landscape, landscape, portrait],
      desktop
    );
    const lastRow = Math.max(...result.boxes.map((b) => b.row));
    const trailing = result.boxes.filter((b) => b.row === lastRow);

    expect(trailing).toHaveLength(1);
    expect(trailing[0].height).toBe(desktop.targetRowHeight);
    expect(trailing[0].left).toBe(0);
    expect(trailing[0].width).toBeLessThan(desktop.containerWidth);
  });

  it("shrinks a lone trailing image that would overflow the container", () => {
    const result = computeJustifiedLayout([landscape, landscape, landscape, panorama], desktop);
    const lastRow = Math.max(...result.boxes.map((b) => b.row));
    const trailing = result.boxes.filter((b) => b.row === lastRow);
    expect(trailing[0].left + trailing[0].width).toBe(desktop.containerWidth);
    expect(trailing[0].height).toBeLessThan(desktop.targetRowHeight);
  });

  it("handles a single image", () => {
    const result = computeJustifiedLayout([landscape], desktop);
    expect(result.boxes).toHaveLength(1);
    expect(result.rowCount).toBe(1);
    expect(result.boxes[0].top).toBe(0);
    expect(result.boxes[0].left).toBe(0);
    expect(result.containerHeight).toBe(result.boxes[0].height);
  });

  it("uses the fallback aspect for images with no stored dimensions", () => {
    const result = computeJustifiedLayout([{}, {}, {}], desktop);
    expect(result.boxes).toHaveLength(3);
    for (const box of result.boxes) {
      expect(box.width / box.height).toBeCloseTo(DEFAULT_ASPECT, 1);
    }
  });

  it("packs a 358px phone column without overflowing", () => {
    // 390px viewport minus the 16px main gutters.
    const phone = { containerWidth: 358, targetRowHeight: 150, gap: 4 };
    const items = [landscape, portrait, square, panorama, landscape, portrait, square];
    const result = computeJustifiedLayout(items, phone);

    expect(result.boxes).toHaveLength(items.length);
    for (const box of result.boxes) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.left + box.width).toBeLessThanOrEqual(phone.containerWidth);
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }

    const rows = [...new Set(result.boxes.map((b) => b.row))];
    const lastRow = rows[rows.length - 1];
    for (const row of rows) {
      if (row === lastRow) continue;
      const inRow = result.boxes.filter((b) => b.row === row);
      const right = inRow[inRow.length - 1].left + inRow[inRow.length - 1].width;
      expect(right).toBe(phone.containerWidth);
    }
  });

  it("fits a lone panorama inside a narrow phone column", () => {
    const phone = { containerWidth: 358, targetRowHeight: 150, gap: 4 };
    const result = computeJustifiedLayout([panorama], phone);
    expect(result.boxes[0].width).toBeLessThanOrEqual(phone.containerWidth);
    // 6:1 in a 358px column is ~60px tall, well under the target.
    expect(result.boxes[0].height).toBeLessThan(phone.targetRowHeight);
  });

  it("is deterministic for the same input", () => {
    const items = [landscape, portrait, square, panorama, landscape];
    const a = computeJustifiedLayout(items, desktop);
    const b = computeJustifiedLayout(items, desktop);
    expect(a).toEqual(b);
  });

  it("produces shorter rows as the container narrows", () => {
    const items = repeat(landscape, 12);
    const wide = computeJustifiedLayout(items, { ...desktop, containerWidth: 1200 });
    const narrow = computeJustifiedLayout(items, { ...desktop, containerWidth: 500 });
    expect(narrow.rowCount).toBeGreaterThan(wide.rowCount);
  });

  it("supports a zero gap", () => {
    const result = computeJustifiedLayout(repeat(landscape, 6), { ...desktop, gap: 0 });
    for (const row of new Set(result.boxes.map((b) => b.row))) {
      const inRow = result.boxes.filter((b) => b.row === row);
      for (let i = 1; i < inRow.length; i++) {
        expect(inRow[i].left).toBe(inRow[i - 1].left + inRow[i - 1].width);
      }
    }
  });
});
