import { describe, it, expect } from "vitest";
import { isZipFile, extractImagesFromZip, getImageDimensions } from "./upload-utils";
import JSZip from "jszip";

describe("upload-utils", () => {
  describe("isZipFile", () => {
    it("returns true for application/zip MIME type", () => {
      const file = new File(["test"], "test.zip", { type: "application/zip" });
      expect(isZipFile(file)).toBe(true);
    });

    it("returns true for application/x-zip-compressed MIME type", () => {
      const file = new File(["test"], "test.zip", { type: "application/x-zip-compressed" });
      expect(isZipFile(file)).toBe(true);
    });

    it("returns true for files ending with .zip", () => {
      const file = new File(["test"], "archive.zip", { type: "application/octet-stream" });
      expect(isZipFile(file)).toBe(true);
    });

    it("returns true for files ending with .ZIP (case insensitive)", () => {
      const file = new File(["test"], "ARCHIVE.ZIP", { type: "application/octet-stream" });
      expect(isZipFile(file)).toBe(true);
    });

    it("returns false for image files", () => {
      const file = new File(["test"], "image.jpg", { type: "image/jpeg" });
      expect(isZipFile(file)).toBe(false);
    });

    it("returns false for other file types", () => {
      const file = new File(["test"], "document.pdf", { type: "application/pdf" });
      expect(isZipFile(file)).toBe(false);
    });
  });

  describe("extractImagesFromZip", () => {
    it("extracts JPG images from zip", async () => {
      const zip = new JSZip();
      zip.file("photo1.jpg", "fake-jpg-data");
      zip.file("photo2.jpg", "fake-jpg-data");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "photos.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(2);
      expect(images[0].name).toBe("photo1.jpg");
      expect(images[1].name).toBe("photo2.jpg");
    });

    it("extracts PNG images from zip", async () => {
      const zip = new JSZip();
      zip.file("screenshot.png", "fake-png-data");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "images.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(1);
      expect(images[0].name).toBe("screenshot.png");
    });

    it("extracts multiple image formats from zip", async () => {
      const zip = new JSZip();
      zip.file("photo.jpg", "fake-jpg");
      zip.file("graphic.png", "fake-png");
      zip.file("animation.gif", "fake-gif");
      zip.file("modern.webp", "fake-webp");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "mixed.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(4);
    });

    it("ignores non-image files in zip", async () => {
      const zip = new JSZip();
      zip.file("photo.jpg", "fake-jpg");
      zip.file("document.pdf", "fake-pdf");
      zip.file("readme.txt", "fake-txt");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "mixed.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(1);
      expect(images[0].name).toBe("photo.jpg");
    });

    it("ignores directories in zip", async () => {
      const zip = new JSZip();
      zip.folder("subfolder");
      zip.file("subfolder/photo.jpg", "fake-jpg");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "nested.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(1);
      expect(images[0].name).toBe("subfolder/photo.jpg");
    });

    it("ignores __MACOSX metadata folder", async () => {
      const zip = new JSZip();
      zip.file("photo.jpg", "fake-jpg");
      zip.file("__MACOSX/._photo.jpg", "mac-metadata");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "mac.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(1);
      expect(images[0].name).toBe("photo.jpg");
    });

    it("ignores hidden files starting with dot", async () => {
      const zip = new JSZip();
      zip.file("photo.jpg", "fake-jpg");
      zip.file(".DS_Store", "mac-metadata");
      zip.file(".hidden.jpg", "hidden-image");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "hidden.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(1);
      expect(images[0].name).toBe("photo.jpg");
    });

    it("handles files without extensions", async () => {
      const zip = new JSZip();
      zip.file("photo.jpg", "fake-jpg");
      zip.file("noextension", "some-data");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "test.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(1);
      expect(images[0].name).toBe("photo.jpg");
    });

    it("handles case-insensitive extensions", async () => {
      const zip = new JSZip();
      zip.file("PHOTO.JPG", "fake-jpg");
      zip.file("image.PNG", "fake-png");
      zip.file("graphic.GIF", "fake-gif");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "uppercase.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(3);
    });

    it("sets correct MIME types for extracted images", async () => {
      const zip = new JSZip();
      zip.file("photo.jpg", "fake-jpg");
      zip.file("graphic.png", "fake-png");
      zip.file("animation.gif", "fake-gif");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "types.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images[0].type).toBe("image/jpeg");
      expect(images[1].type).toBe("image/png");
      expect(images[2].type).toBe("image/gif");
    });

    it("returns empty array for zip with no images", async () => {
      const zip = new JSZip();
      zip.file("document.pdf", "fake-pdf");
      zip.file("readme.txt", "fake-txt");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "no-images.zip", { type: "application/zip" });

      const images = await extractImagesFromZip(zipFile);
      expect(images).toHaveLength(0);
    });
  });

  describe("getImageDimensions", () => {
    it("returns null for non-image files", async () => {
      // Skip this test in Node environment since it requires browser APIs
      if (typeof window === "undefined") {
        return;
      }
      
      const file = new File(["not an image"], "test.txt", { type: "text/plain" });
      const dimensions = await getImageDimensions(file);
      expect(dimensions).toBeNull();
    });

    // Note: Testing actual image dimension extraction requires either:
    // 1. Real image files (which we'd need to generate or load)
    // 2. Mocking the Image constructor and load events
    // Since this is a browser API that creates actual DOM Image elements,
    // it's better tested in an E2E environment with real images
  });
});
