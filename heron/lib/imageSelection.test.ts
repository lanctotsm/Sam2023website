import { describe, expect, it } from "vitest";
import { applyImageSelection } from "@/lib/imageSelection";

const ids = [1, 2, 3, 4, 5];

function sorted(set: Set<number>): number[] {
  return Array.from(set).sort((a, b) => a - b);
}

describe("applyImageSelection", () => {
  it("starts a shift range on the first shift click and clears prior selection", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([4, 5]),
      targetId: 2,
      pendingShiftStartId: null,
      modifiers: { shiftKey: true, ctrlOrMeta: false }
    });

    expect(sorted(result.selectedIds)).toEqual([2]);
    expect(result.pendingShiftStartId).toBe(2);
    expect(result.rangeStartId).toBe(2);
    expect(result.rangeEndId).toBeNull();
  });

  it("closes the shift range on the second shift click", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([2]),
      targetId: 5,
      pendingShiftStartId: 2,
      modifiers: { shiftKey: true, ctrlOrMeta: false }
    });

    expect(sorted(result.selectedIds)).toEqual([2, 3, 4, 5]);
    expect(result.pendingShiftStartId).toBeNull();
    expect(result.rangeStartId).toBe(2);
    expect(result.rangeEndId).toBe(5);
  });

  it("starts a fresh shift range after a completed one (third shift click)", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([2, 3, 4, 5]),
      targetId: 1,
      pendingShiftStartId: null,
      modifiers: { shiftKey: true, ctrlOrMeta: false }
    });

    expect(sorted(result.selectedIds)).toEqual([1]);
    expect(result.pendingShiftStartId).toBe(1);
    expect(result.rangeStartId).toBe(1);
    expect(result.rangeEndId).toBeNull();
  });

  it("toggles membership with ctrl/meta without clearing the set", () => {
    const add = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([1]),
      targetId: 3,
      pendingShiftStartId: null,
      modifiers: { shiftKey: false, ctrlOrMeta: true }
    });
    expect(sorted(add.selectedIds)).toEqual([1, 3]);
    expect(add.pendingShiftStartId).toBeNull();
    expect(add.rangeStartId).toBeNull();
    expect(add.rangeEndId).toBeNull();

    const remove = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([1, 3]),
      targetId: 1,
      pendingShiftStartId: null,
      modifiers: { shiftKey: false, ctrlOrMeta: true }
    });
    expect(sorted(remove.selectedIds)).toEqual([3]);
  });

  it("clears pending shift state when ctrl/meta toggles", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([2]),
      targetId: 4,
      pendingShiftStartId: 2,
      modifiers: { shiftKey: false, ctrlOrMeta: true }
    });

    expect(sorted(result.selectedIds)).toEqual([2, 4]);
    expect(result.pendingShiftStartId).toBeNull();
    expect(result.rangeStartId).toBeNull();
    expect(result.rangeEndId).toBeNull();
  });

  it("replaces selection on a non-modifier selection start", () => {
    const result = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([1, 2]),
      targetId: 4,
      pendingShiftStartId: 1,
      modifiers: { shiftKey: false, ctrlOrMeta: false }
    });

    expect(sorted(result.selectedIds)).toEqual([4]);
    expect(result.pendingShiftStartId).toBeNull();
    expect(result.rangeStartId).toBeNull();
    expect(result.rangeEndId).toBeNull();
  });

  it("prefers two-step shift over ctrl when both are pressed", () => {
    const start = applyImageSelection({
      orderedIds: ids,
      selectedIds: new Set([5]),
      targetId: 1,
      pendingShiftStartId: null,
      modifiers: { shiftKey: true, ctrlOrMeta: true }
    });
    expect(sorted(start.selectedIds)).toEqual([1]);
    expect(start.pendingShiftStartId).toBe(1);

    const end = applyImageSelection({
      orderedIds: ids,
      selectedIds: start.selectedIds,
      targetId: 3,
      pendingShiftStartId: start.pendingShiftStartId,
      modifiers: { shiftKey: true, ctrlOrMeta: true }
    });
    expect(sorted(end.selectedIds)).toEqual([1, 2, 3]);
    expect(end.rangeStartId).toBe(1);
    expect(end.rangeEndId).toBe(3);
  });
});
