import { addImageToAlbum as addImageToAlbumService } from "@/services/album-images";
import { getAlbumById } from "@/services/albums";
import { getImageById } from "@/services/images";

export async function linkImageToAlbum(params: {
  albumId: number;
  imageId: number;
  sortOrder?: number;
}) {
  const { albumId, imageId, sortOrder = 0 } = params;

  // Business logic: Verify both exist before linking
  const [album, image] = await Promise.all([
    getAlbumById(albumId),
    getImageById(imageId)
  ]);

  if (!album) {
    throw new Error("Album not found");
  }
  if (!image) {
    throw new Error("Image not found");
  }

  return await addImageToAlbumService(albumId, imageId, sortOrder);
}
