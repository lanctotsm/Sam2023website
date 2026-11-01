import JSZip from "jszip";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

export function maxUploadMegabytes(): number {
  return Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
}

export function isFileWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_UPLOAD_BYTES;
}

export type PrepareUploadFilesResult =
  | { ok: true; files: File[]; extractedCount: number }
  | { ok: false; reason: "zip" }
  | { ok: false; reason: "oversized"; oversizedNames: string[] };

/**
 * Expand zips and reject files over MAX_UPLOAD_BYTES. Callers own toasts
 * and the upload target.
 */
export async function prepareUploadFiles(selectedFiles: File[]): Promise<PrepareUploadFilesResult> {
  const zipFiles = selectedFiles.filter(isZipFile);
  const imageFiles = selectedFiles.filter((file) => !isZipFile(file));
  let files = [...imageFiles];

  if (zipFiles.length > 0) {
    try {
      for (const zipFile of zipFiles) {
        const extracted = await extractImagesFromZip(zipFile);
        files = [...files, ...extracted];
      }
    } catch {
      return { ok: false, reason: "zip" };
    }
  }

  const oversized = files.filter((file) => !isFileWithinSizeLimit(file));
  if (oversized.length > 0) {
    return {
      ok: false,
      reason: "oversized",
      oversizedNames: oversized.map((file) => file.name),
    };
  }

  return { ok: true, files, extractedCount: files.length - imageFiles.length };
}

/**
 * Extract image files from a zip file
 */
export async function extractImagesFromZip(zipFile: File): Promise<File[]> {
  const zip = new JSZip();
  const zipData = await zipFile.arrayBuffer();
  const contents = await zip.loadAsync(zipData);
  
  const imageFiles: File[] = [];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  
  for (const [filename, fileData] of Object.entries(contents.files)) {
    // Skip directories and hidden files
    if (fileData.dir || filename.startsWith("__MACOSX") || filename.startsWith(".")) {
      continue;
    }
    
    // Check if it's an image file
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1) {
      continue; // Skip files without extensions
    }
    const ext = filename.toLowerCase().slice(lastDotIndex);
    if (!imageExtensions.includes(ext)) {
      continue;
    }
    
    const blob = await fileData.async("blob");
    const mimeType = getMimeType(ext);
    const file = new File([blob], filename, { type: mimeType });
    imageFiles.push(file);
  }
  
  return imageFiles;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp"
  };
  return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
}

/**
 * Check if a file is a zip file
 */
export function isZipFile(file: File): boolean {
  return file.type === "application/zip" || 
         file.type === "application/x-zip-compressed" ||
         file.name.toLowerCase().endsWith(".zip");
}
