import { describe, expect, it } from "vitest";
import { applyImageSelection } from "@/lib/imageSelection";

const ids = [1, 2, 3, 4, 5];

function sorted(set: Set<number>): number[] {
  return Array.from(set).sort((a, b) => a - b);
}

describe("applyImageSelection", () => {
  it("replaces selection on plain click", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([1, 2]),
      targetId: 4,
      anchorId: 2,
      modifiers: { shiftKey: false, ctrlOrMeta: false }
    });

    expect(sorted(result.selectedIds)).toEqual([4]);
    expect(result.anchorId).toBe(4);
  });

  it("toggles membership with ctrl/meta click", () => {
    const add = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([1]),
      targetId: 3,
      anchorId: 1,
      modifiers: { shiftKey: false, ctrlOrMeta: true }
    });
    expect(sorted(add.selectedIds)).toEqual([1, 3]);
    expect(add.anchorId).toBe(3);

    const remove = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([1, 3]),
      targetId: 1,
      anchorId: 3,
      modifiers: { shiftKey: false, ctrlOrMeta: true }
    });
    expect(sorted(remove.selectedIds)).toEqual([3]);
    expect(remove.anchorId).toBe(1);
  });

  it("selects inclusive range from anchor on shift click", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([2]),
      targetId: 5,
      anchorId: 2,
      modifiers: { shiftKey: true, ctrlOrMeta: false }
    });

    expect(sorted(result.selectedIds)).toEqual([2, 3, 4, 5]);
    expect(result.anchorId).toBe(5);
  });

  it("adds shift range without clearing items outside the range", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([1]),
      targetId: 4,
      anchorId: 2,
      modifiers: { shiftKey: true, ctrlOrMeta: false }
    });

    expect(sorted(result.selectedIds)).toEqual([1, 2, 3, 4]);
    expect(result.anchorId).toBe(4);
  });

  it("falls back to replace when shift has no usable anchor", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([1]),
      targetId: 3,
      anchorId: null,
      modifiers: { shiftKey: true, ctrlOrMeta: false }
    });

    expect(sorted(result.selectedIds)).toEqual([3]);
    expect(result.anchorId).toBe(3);
  });

  it("prefers shift range over ctrl when both are pressed", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([1]),
      targetId: 3,
      anchorId: 1,
      modifiers: { shiftKey: true, ctrlOrMeta: true }
    });

    expect(sorted(result.selectedIds)).toEqual([1, 2, 3]);
    expect(result.anchorId).toBe(3);
  });
});
