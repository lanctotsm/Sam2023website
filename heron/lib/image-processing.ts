import sharp from "sharp";

const THUMB_MAX_EDGE = 400;
const THUMB_QUALITY = 80;
const LARGE_MAX_MP = 25;
const LARGE_QUALITY = 85;

function getLargeMaxDimension(): number {
  const mp = Number(process.env.LARGE_IMAGE_MAX_MP) || LARGE_MAX_MP;
  return Math.floor(Math.sqrt(mp * 1_000_000));
}

export type ProcessedImage = {
  thumb: { buffer: Buffer; width: number; height: number };
  large: { buffer: Buffer; width: number; height: number };
  original: { buffer: Buffer; width: number; height: number; contentType: string };
};

/**
 * Process an image buffer into thumb (max 400px), large (cap 25MP), and original.
 * Thumb and large are JPEG; original keeps original format.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const format = (meta.format as string) || "jpeg";

  const thumb = await sharp(input)
    .resize(THUMB_MAX_EDGE, THUMB_MAX_EDGE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY })
    .toBuffer();
  const thumbMeta = await sharp(thumb).metadata();

  const largeMax = getLargeMaxDimension();
  const largePipeline = sharp(input);
  const needsResize =
    width > largeMax || height > largeMax || (width * height > LARGE_MAX_MP * 1_000_000);
  const largeBuffer = needsResize
    ? await largePipeline
        .resize(largeMax, largeMax, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: LARGE_QUALITY })
        .toBuffer()
    : await largePipeline.jpeg({ quality: LARGE_QUALITY }).toBuffer();
  const largeMeta = await sharp(largeBuffer).metadata();

  const mimeByFormat: Record<string, string> = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif"
  };
  const originalContentType = mimeByFormat[format] ?? "image/jpeg";

  return {
    thumb: {
      buffer: thumb,
      width: thumbMeta.width ?? 0,
      height: thumbMeta.height ?? 0
    },
    large: {
      buffer: largeBuffer,
      width: largeMeta.width ?? width,
      height: largeMeta.height ?? height
    },
    original: {
      buffer: Buffer.from(input),
      width,
      height,
      contentType: originalContentType
    }
  };
}
