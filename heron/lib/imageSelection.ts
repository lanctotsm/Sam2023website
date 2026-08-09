/** Keyboard modifiers that change how a gallery click updates selection. */
export type SelectionModifiers = {
  /** Inclusive range from the previous anchor to the clicked item. */
  shiftKey: boolean;
  /** Toggle membership of one item without clearing the rest of the set. */
  ctrlOrMeta: boolean;
};

/**
 * Inputs for one selection gesture against an ordered gallery.
 *
 * `orderedIds` is the visual left-to-right / top-to-bottom id list used to
 * compute Shift ranges. `anchorId` is the last item the user clicked (or
 * null before any selection), which Shift ranges grow from.
 */
export type ApplyImageSelectionInput = {
  orderedIds: number[];
  selectedIds: Set<number>;
  /** Image the user just activated (thumbnail click or checkbox). */
  targetId: number;
  /** Previous selection anchor; required for a meaningful Shift range. */
  anchorId: number | null;
  modifiers: SelectionModifiers;
};

/**
 * Next selection set plus the new anchor to store for a later Shift+click.
 * Callers should replace both pieces of UI state from this result.
 */
export type ApplyImageSelectionResult = {
  selectedIds: Set<number>;
  anchorId: number;
};

/**
 * Pure multiselect reducer for admin album thumbnails.
 *
 * Intent: mirror common desktop gallery selection without requiring the
 * checkbox hit target — plain click, additive Ctrl/Cmd, and Shift ranges.
 *
 * Implementation (priority order):
 * 1. Shift + known anchor → add every id between anchor and target in
 *    `orderedIds` (inclusive). Existing selections outside that span stay.
 *    If the anchor/target cannot be found in order, fall through.
 * 2. Ctrl or Meta → toggle `targetId` in a copy of `selectedIds`.
 * 3. Otherwise → replace the selection with only `targetId`.
 *
 * Every path returns `anchorId: targetId` so the next Shift+click ranges
 * from this interaction.
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
