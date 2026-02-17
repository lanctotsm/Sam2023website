import JSZip from "jszip";

/** Max file size for upload (client-side check, must match or be under server MAX_UPLOAD_BYTES). 100MB. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export function isFileWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_UPLOAD_BYTES;
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

/**
 * Get image dimensions from a File object
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
