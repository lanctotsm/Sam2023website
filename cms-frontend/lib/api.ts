export type Post = {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  markdown: string;
  status: string;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type Album = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type Image = {
  id: number;
  s3_key: string;
  width?: number | null;
  height?: number | null;
  caption?: string;
  alt_text?: string;
  created_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getPosts(): Promise<Post[]> {
  return apiFetch<Post[]>("/posts");
}

export async function getPostBySlug(slug: string): Promise<Post> {
  return apiFetch<Post>(`/posts/slug/${slug}`);
}

export async function getAlbums(): Promise<Album[]> {
  return apiFetch<Album[]>("/albums");
}

export async function getAlbumBySlug(slug: string): Promise<Album> {
  return apiFetch<Album>(`/albums/slug/${slug}`);
}

export async function getAlbumImages(albumId: number): Promise<Image[]> {
  return apiFetch<Image[]>(`/albums/${albumId}/images`);
}

export async function getImages(): Promise<Image[]> {
  return apiFetch<Image[]>("/images");
}

export async function createPost(payload: Partial<Post>): Promise<Post> {
  return apiFetch<Post>("/posts", { method: "POST", body: JSON.stringify(payload) });
}

export async function createAlbum(payload: Partial<Album>): Promise<Album> {
  return apiFetch<Album>("/albums", { method: "POST", body: JSON.stringify(payload) });
}

export async function createImage(payload: Partial<Image>): Promise<Image> {
  return apiFetch<Image>("/images", { method: "POST", body: JSON.stringify(payload) });
}

export async function linkAlbumImage(albumId: number, imageId: number, sortOrder: number) {
  return apiFetch(`/albums/${albumId}/images`, {
    method: "POST",
    body: JSON.stringify({ image_id: imageId, sort_order: sortOrder })
  });
}

export async function presignImage(fileName: string, contentType: string, size: number) {
  return apiFetch<{
    upload_url: string;
    s3_key: string;
    public_url: string;
  }>("/images/presign", {
    method: "POST",
    body: JSON.stringify({
      file_name: fileName,
      content_type: contentType,
      size
    })
  });
}
