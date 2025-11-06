const API_BASE_URL = process.env.NEXT_PUBLIC_PHOTO_API_URL || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev';

export interface Photo {
  id: string;
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

export interface PhotoUpload {
  imageData: string; // base64 encoded
  contentType: string;
  title: string;
  description: string;
  tags: string[];
}

export class PhotoAPI {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async uploadPhoto(upload: PhotoUpload): Promise<Photo> {
    return this.request('/upload', {
      method: 'POST',
      body: JSON.stringify(upload),
    });
  }

  static async listPhotos(): Promise<{ photos: Photo[]; count: number }> {
    return this.request('/photos');
  }

  static getPhotoUrl(bucketUrl: string, key: string): string {
    return `${bucketUrl}/${key}`;
  }

  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}