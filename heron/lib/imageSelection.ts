export type SelectionModifiers = {
  shiftKey: boolean;
  ctrlOrMeta: boolean;
};

export type ApplyImageSelectionInput = {
  orderedIds: number[];
  selectedIds: Set<number>;
  targetId: number;
  anchorId: number | null;
  modifiers: SelectionModifiers;
};

export type ApplyImageSelectionResult = {
  selectedIds: Set<number>;
  anchorId: number;
};

/**
 * Desktop gallery-style multiselect:
 * - plain click replaces selection
 * - ctrl/meta click toggles one item
 * - shift click selects inclusive range from anchor (adds; keeps outside)
 */
export function applyImageSelection({
  orderedIds,
  selectedIds,
  targetId,
  anchorId,
  modifiers
}: ApplyImageSelectionInput): ApplyImageSelectionResult {
  if (modifiers.shiftKey && anchorId != null) {
    const start = orderedIds.indexOf(anchorId);
    const end = orderedIds.indexOf(targetId);
    if (start !== -1 && end !== -1) {
      const next = new Set(selectedIds);
      const [from, to] = start < end ? [start, end] : [end, start];
      for (let i = from; i <= to; i++) {
        next.add(orderedIds[i]);
      }
      return { selectedIds: next, anchorId: targetId };
    }
  }

  if (modifiers.ctrlOrMeta) {
    const next = new Set(selectedIds);
    if (next.has(targetId)) {
      next.delete(targetId);
    } else {
      next.add(targetId);
    }
    return { selectedIds: next, anchorId: targetId };
  }

  return { selectedIds: new Set([targetId]), anchorId: targetId };
}
