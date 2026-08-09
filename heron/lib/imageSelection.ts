/** Keyboard modifiers that change how a gallery click updates selection. */
export type SelectionModifiers = {
  /**
   * Two-step range select: first Shift+click sets the start (clears prior
   * selection); second Shift+click closes the range between start and target.
   */
  shiftKey: boolean;
  /** Toggle membership of one item without clearing the rest of the set. */
  ctrlOrMeta: boolean;
};

/**
 * Inputs for one selection gesture against an ordered gallery.
 *
 * `pendingShiftStartId` is set after the first Shift+click and cleared when
 * the second Shift+click closes the range (or when a non-Ctrl selection starts).
 */
export type ApplyImageSelectionInput = {
  orderedIds: number[];
  selectedIds: Set<number>;
  /** Image the user just activated. */
  targetId: number;
  /** Open Shift-range start waiting for the closing click, if any. */
  pendingShiftStartId: number | null;
  modifiers: SelectionModifiers;
};

/**
 * Next selection set plus Shift-range bookkeeping for the UI.
 *
 * `rangeStartId` / `rangeEndId` mark the visible ends of the active range
 * (end is null while waiting for the second Shift+click).
 */
export type ApplyImageSelectionResult = {
  selectedIds: Set<number>;
  pendingShiftStartId: number | null;
  rangeStartId: number | null;
  rangeEndId: number | null;
};

function idsBetween(orderedIds: number[], fromId: number, toId: number): number[] | null {
  const start = orderedIds.indexOf(fromId);
  const end = orderedIds.indexOf(toId);
  if (start === -1 || end === -1) return null;
  const [from, to] = start < end ? [start, end] : [end, start];
  return orderedIds.slice(from, to + 1);
}

/**
 * Pure multiselect reducer for admin album thumbnails.
 *
 * Intent:
 * - Shift is a two-click range: 1st click starts (clears), 2nd click closes.
 * - Ctrl/Cmd toggles one item without clearing the existing set.
 * - Any other selection start replaces the set (clears first).
 *
 * Implementation (priority order):
 * 1. Shift + no pending start → clear, select target, pending = target,
 *    range start = target, range end = null.
 * 2. Shift + pending start → select inclusive span pending→target, clear
 *    pending, set range start/end to the two endpoints.
 * 3. Ctrl/Meta → toggle target; clear pending and range endpoint markers
 *    (set is no longer a pure Shift range).
 * 4. Otherwise → replace selection with only target; clear pending/range ends.
 */
export function applyImageSelection({
  orderedIds,
  selectedIds,
  targetId,
  pendingShiftStartId,
  modifiers
}: ApplyImageSelectionInput): ApplyImageSelectionResult {
  if (modifiers.shiftKey) {
    if (pendingShiftStartId == null) {
      return {
        selectedIds: new Set([targetId]),
        pendingShiftStartId: targetId,
        rangeStartId: targetId,
        rangeEndId: null
      };
    }

    const span = idsBetween(orderedIds, pendingShiftStartId, targetId);
    if (!span) {
      return {
        selectedIds: new Set([targetId]),
        pendingShiftStartId: targetId,
        rangeStartId: targetId,
        rangeEndId: null
      };
    }

    return {
      selectedIds: new Set(span),
      pendingShiftStartId: null,
      rangeStartId: pendingShiftStartId,
      rangeEndId: targetId
    };
  }

  if (modifiers.ctrlOrMeta) {
    const next = new Set(selectedIds);
    if (next.has(targetId)) {
      next.delete(targetId);
    } else {
      next.add(targetId);
    }
    return {
      selectedIds: next,
      pendingShiftStartId: null,
      rangeStartId: null,
      rangeEndId: null
    };
  }

  return {
    selectedIds: new Set([targetId]),
    pendingShiftStartId: null,
    rangeStartId: null,
    rangeEndId: null
  };
}
