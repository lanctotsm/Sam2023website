declare module "react-image-crop" {
  import * as React from "react";

  export interface Crop {
    unit?: "%" | "px";
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }

  export interface ReactCropProps {
    crop?: Crop;
    onChange?: (crop: Crop, percentCrop: Crop) => void;
    onComplete?: (crop: Crop, percentCrop: Crop) => void;
    aspect?: number;
    className?: string;
    children?: React.ReactNode;
  }

  export default function ReactCrop(props: ReactCropProps): JSX.Element;

  export function centerCrop(
    crop: Crop,
    mediaWidth: number,
    mediaHeight: number
  ): Crop;

  export function makeAspectCrop(
    crop: Crop,
    aspect: number,
    mediaWidth: number,
    mediaHeight: number
  ): Crop;
}

