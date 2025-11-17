export class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function assertApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      'REACT_APP_API_BASE_URL is not configured. Please set it in your environment variables.',
    );
  }

  return API_BASE_URL.replace(/\/$/, '');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = assertApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new ApiError(
      (data as { error?: string; message?: string })?.error ||
        (data as { message?: string })?.message ||
        response.statusText,
      response.status,
      data,
    );
  }

  return data as T;
}

export const apiClient = {
  get<T>(path: string) {
    return request<T>(path, { method: 'GET' });
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  put<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(path: string) {
    return request<T>(path, { method: 'DELETE' });
  },
};

export function getApiBaseUrl(): string {
  return assertApiBaseUrl();
}
