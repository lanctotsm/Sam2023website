import {
  AlbumSummary,
  AlbumSummaryDto,
  ListAlbumsResponse,
  ListAlbumsResponseDto,
  ListPhotosResponse,
  ListPhotosResponseDto,
  PhotoMetadata,
  PhotoMetadataDto,
} from './types';

export function mapAlbumSummary(dto: AlbumSummaryDto): AlbumSummary {
  return {
    id: dto.album_id,
    name: dto.name,
    photoCount: dto.photo_count,
    thumbnailKey: dto.thumbnail_id,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function mapPhotoMetadata(dto: PhotoMetadataDto): PhotoMetadata {
  return {
    id: dto.id,
    albumId: dto.album_id,
    originalKey: dto.originalKey,
    mediumKey: dto.mediumKey,
    thumbnailKey: dto.thumbnailKey,
    title: dto.title,
    description: dto.description,
    tags: dto.tags,
    uploadedAt: dto.uploadedAt,
    fileSize: dto.fileSize,
    width: dto.width,
    height: dto.height,
    contentType: dto.contentType,
  };
}

export function mapAlbumsResponse(response: ListAlbumsResponseDto): ListAlbumsResponse {
  return {
    count: response.count,
    albums: response.albums.map(mapAlbumSummary),
  };
}

export function mapPhotosResponse(response: ListPhotosResponseDto): ListPhotosResponse {
  return {
    count: response.count,
    photos: response.photos.map(mapPhotoMetadata),
  };
}
