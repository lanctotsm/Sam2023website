export interface AuthUser {
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user?: AuthUser;
}

export interface AlbumSummaryDto {
  album_id: string;
  name: string;
  photo_count: number;
  thumbnail_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AlbumSummary {
  id: string;
  name: string;
  photoCount: number;
  thumbnailKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListAlbumsResponseDto {
  albums: AlbumSummaryDto[];
  count: number;
}

export interface ListAlbumsResponse {
  albums: AlbumSummary[];
  count: number;
}

export interface PhotoMetadataDto {
  id: string;
  album_id: string;
  originalKey: string;
  thumbnailKey: string;
  mediumKey: string;
  title: string;
  description: string;
  tags: string[];
  uploadedAt: string;
  fileSize: number;
  width: number;
  height: number;
  contentType: string;
}

export interface PhotoMetadata {
  id: string;
  albumId: string;
  originalKey: string;
  thumbnailKey: string;
  mediumKey: string;
  title: string;
  description: string;
  tags: string[];
  uploadedAt: string;
  fileSize: number;
  width: number;
  height: number;
  contentType: string;
}

export interface ListPhotosResponseDto {
  photos: PhotoMetadataDto[];
  count: number;
}

export interface ListPhotosResponse {
  photos: PhotoMetadata[];
  count: number;
}

export interface CreateAlbumPayload {
  name: string;
}

export interface UploadPhotoPayload {
  albumId: string;
  imageData: string;
  contentType: string;
  title?: string;
  description?: string;
  tags?: string[];
}
