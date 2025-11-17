import { apiClient } from './httpClient';
import { mapPhotoMetadata } from './mappers';
import { PhotoMetadata, PhotoMetadataDto, UploadPhotoPayload } from './types';

export const photoApi = {
  async upload(payload: UploadPhotoPayload): Promise<PhotoMetadata> {
    const response = await apiClient.post<PhotoMetadataDto>('/upload', payload);
    return mapPhotoMetadata(response);
  },
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
