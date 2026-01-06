// API service for communicating with the photo backend
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Types for API responses
export interface Album {
  album_id: string;
  name: string;
  photo_count: number;
  thumbnail_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  album_id: string;
  user_email: string;
  original_key: string;
  medium_key: string;
  thumbnail_key: string;
  title?: string;
  description?: string;
  tags?: string[];
  uploaded_at: string;
  file_size: number;
  width: number;
  height: number;
  content_type: string;
}

export interface User {
  email: string;
  name?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export interface UploadPhotoRequest {
  imageData: string; // base64 encoded
  contentType: string;
  albumId: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface CreateAlbumRequest {
  name: string;
}

export interface ListAlbumsResponse {
  albums: Album[];
  count: number;
}

export interface ListPhotosResponse {
  photos: Photo[];
  count: number;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true, // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Redirect to login on authentication failure
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(): Promise<void> {
    window.location.href = `${API_BASE_URL}/auth/login`;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    window.location.href = '/';
  }

  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const response = await this.client.get<AuthStatus>('/auth/status');
      return response.data;
    } catch (error) {
      return { authenticated: false };
    }
  }

  // Albums
  async listAlbums(): Promise<ListAlbumsResponse> {
    const response = await this.client.get<ListAlbumsResponse>('/albums');
    return response.data;
  }

  async createAlbum(request: CreateAlbumRequest): Promise<Album> {
    const response = await this.client.post<Album>('/albums', request);
    return response.data;
  }

  async deleteAlbum(albumId: string): Promise<void> {
    await this.client.delete(`/albums/${albumId}`);
  }

  async setAlbumThumbnail(albumId: string, photoId: string): Promise<Album> {
    const response = await this.client.put<Album>(
      `/albums/${albumId}/thumbnail`,
      { photo_id: photoId }
    );
    return response.data;
  }

  // Photos
  async listAlbumPhotos(albumId: string): Promise<ListPhotosResponse> {
    const response = await this.client.get<ListPhotosResponse>(
      `/albums/${albumId}/photos`
    );
    return response.data;
  }

  async uploadPhoto(request: UploadPhotoRequest): Promise<Photo> {
    const response = await this.client.post<Photo>('/upload', request);
    return response.data;
  }

  async deletePhoto(photoId: string): Promise<void> {
    await this.client.delete(`/photos/${photoId}`);
  }

  async getPhoto(photoId: string): Promise<Photo> {
    const response = await this.client.get<Photo>(`/photos/${photoId}`);
    return response.data;
  }

  // Helper to get presigned URL for images
  getImageUrl(key: string): string {
    // Assuming S3 keys are returned from backend
    // You may need to adjust based on actual backend response
    return key;
  }
}

export const apiService = new ApiService();
