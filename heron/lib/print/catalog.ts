import type { PrintSizeInches } from "./quality";

export type FrameStyleId = "none" | "black" | "white" | "wood";

export type FrameStyle = {
  id: FrameStyleId;
  label: string;
  /** CSS border / box-shadow for wall preview chrome */
  border: string;
  mat: string;
};

/** Standard photo print sizes (short × long inches). */
export const PRINT_SIZES: PrintSizeInches[] = [
  { id: "4x6", label: "4×6", shortIn: 4, longIn: 6 },
  { id: "5x7", label: "5×7", shortIn: 5, longIn: 7 },
  { id: "8x10", label: "8×10", shortIn: 8, longIn: 10 },
  { id: "11x14", label: "11×14", shortIn: 11, longIn: 14 },
  { id: "16x20", label: "16×20", shortIn: 16, longIn: 20 }
];

export const FRAME_STYLES: FrameStyle[] = [
  {
    id: "none",
    label: "No frame",
    border: "none",
    mat: "transparent"
  },
  {
    id: "black",
    label: "Black",
    border: "10px solid #1a1a1a",
    mat: "#f5f0e8"
  },
  {
    id: "white",
    label: "White",
    border: "10px solid #f7f7f5",
    mat: "#ebe6dc"
  },
  {
    id: "wood",
    label: "Wood",
    border: "12px solid #8b6914",
    mat: "#f3ebe0"
  }
];

export function getFrameStyle(id: FrameStyleId): FrameStyle {
  return FRAME_STYLES.find((f) => f.id === id) ?? FRAME_STYLES[0];
}

export function isPrintOrderingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRINT_ORDERING === "peecho";
}

export function peechoButtonScriptId(): string {
  return (process.env.NEXT_PUBLIC_PEECHO_BUTTON_SCRIPT_ID || "").trim();
}
