/**
 * Row-packing ("justified") layout for photo grids.
 *
 * Pure and deterministic so it can be unit tested and run identically on the
 * server and the client. Images keep their aspect ratio and each full row is
 * scaled to fill the container width exactly, which is what makes the grid
 * read as flush columns of mixed-orientation photos.
 */

export type LayoutInput = {
  width?: number | null;
  height?: number | null;
};

export type LayoutBox = {
  /** Index into the input array. */
  index: number;
  top: number;
  left: number;
  width: number;
  height: number;
  /** Zero-based row this box landed in. */
  row: number;
};

export type LayoutResult = {
  boxes: LayoutBox[];
  containerHeight: number;
  rowCount: number;
};

export type JustifiedLayoutOptions = {
  containerWidth: number;
  targetRowHeight: number;
  gap: number;
  /**
   * The trailing row is usually not full, so it keeps the target height rather
   * than stretching. This caps how tall it may get.
   */
  maxLastRowHeight?: number;
};

/** Used when an image has no stored dimensions; 3:2 is the common photo ratio. */
export const DEFAULT_ASPECT = 1.5;

export function aspectOf(input: LayoutInput): number {
  const w = input.width;
  const h = input.height;
  if (typeof w !== "number" || typeof h !== "number") return DEFAULT_ASPECT;
  if (!Number.isFinite(w) || !Number.isFinite(h)) return DEFAULT_ASPECT;
  if (w <= 0 || h <= 0) return DEFAULT_ASPECT;
  return w / h;
}

export function computeJustifiedLayout(
  items: LayoutInput[],
  options: JustifiedLayoutOptions
): LayoutResult {
  const { containerWidth, targetRowHeight, gap } = options;
  const maxLastRowHeight = options.maxLastRowHeight ?? targetRowHeight * 1.5;

  const empty: LayoutResult = { boxes: [], containerHeight: 0, rowCount: 0 };
  if (items.length === 0) return empty;
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return empty;
  if (!Number.isFinite(targetRowHeight) || targetRowHeight <= 0) return empty;

  const aspects = items.map(aspectOf);

  // Group indices into rows, closing a row once it would overflow the container.
  const rows: number[][] = [];
  let current: number[] = [];
  let sumAspect = 0;

  for (let i = 0; i < items.length; i++) {
    current.push(i);
    sumAspect += aspects[i];

    const naturalWidth = sumAspect * targetRowHeight + gap * (current.length - 1);
    if (naturalWidth >= containerWidth) {
      rows.push(current);
      current = [];
      sumAspect = 0;
    }
  }
  if (current.length > 0) rows.push(current);

  const boxes: LayoutBox[] = [];
  let top = 0;

  rows.forEach((row, rowIndex) => {
    const isLastRow = rowIndex === rows.length - 1;
    const rowSumAspect = row.reduce((sum, i) => sum + aspects[i], 0);
    const available = containerWidth - gap * (row.length - 1);

    // A full row scales to fill exactly; the trailing row keeps the target
    // height unless a single wide image would overflow.
    let rowHeight: number;
    let fillsRow: boolean;
    if (isLastRow) {
      const naturalWidth = rowSumAspect * targetRowHeight + gap * (row.length - 1);
      if (naturalWidth >= containerWidth) {
        rowHeight = available / rowSumAspect;
        fillsRow = true;
      } else {
        rowHeight = Math.min(targetRowHeight, maxLastRowHeight);
        fillsRow = false;
      }
    } else {
      rowHeight = available / rowSumAspect;
      fillsRow = true;
    }

    const roundedHeight = Math.max(1, Math.round(rowHeight));

    // Round cumulative edges rather than individual widths so boxes tile
    // exactly with no sub-pixel seams or overflow.
    let exactLeft = 0;
    row.forEach((itemIndex) => {
      const exactWidth = aspects[itemIndex] * rowHeight;
      const left = Math.round(exactLeft);
      const isLastInRow = itemIndex === row[row.length - 1];
      const right = fillsRow && isLastInRow
        ? Math.round(containerWidth)
        : Math.round(exactLeft + exactWidth);

      boxes.push({
        index: itemIndex,
        top,
        left,
        width: Math.max(1, right - left),
        height: roundedHeight,
        row: rowIndex
      });

      exactLeft += exactWidth + gap;
    });

    top += roundedHeight + gap;
  });

  return {
    boxes,
    // Trailing gap is not part of the content height.
    containerHeight: Math.max(0, top - gap),
    rowCount: rows.length
  };
}
