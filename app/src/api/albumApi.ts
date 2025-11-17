import { apiClient, ApiError } from './httpClient';
import { mapAlbumSummary, mapAlbumsResponse, mapPhotosResponse } from './mappers';
import {
  AlbumSummary,
  AlbumSummaryDto,
  CreateAlbumPayload,
  ListAlbumsResponse,
  ListAlbumsResponseDto,
  ListPhotosResponse,
  ListPhotosResponseDto,
} from './types';

export const albumApi = {
  async list(): Promise<ListAlbumsResponse> {
    const response = await apiClient.get<ListAlbumsResponseDto>('/albums');
    return mapAlbumsResponse(response);
  },
  async create(payload: CreateAlbumPayload): Promise<AlbumSummary> {
    const response = await apiClient.post<AlbumSummaryDto | AlbumSummary>('/albums', payload);
    if ('album_id' in (response as AlbumSummaryDto)) {
      return mapAlbumSummary(response as AlbumSummaryDto);
    }

    return response as AlbumSummary;
  },
  async listPhotos(albumId: string): Promise<ListPhotosResponse> {
    const response = await apiClient.get<ListPhotosResponseDto>(`/albums/${albumId}/photos`);
    return mapPhotosResponse(response);
  },
  isUnauthorized(error: unknown): boolean {
    return error instanceof ApiError && error.status === 401;
  },
};
