import { apiClient, getApiBaseUrl } from './httpClient';
import { AuthStatusResponse } from './types';

interface LoginResponse {
  oauth_url: string;
  state: string;
}

interface LogoutResponse {
  message: string;
}

export const authApi = {
  getStatus(): Promise<AuthStatusResponse> {
    return apiClient.get<AuthStatusResponse>('/auth/status');
  },
  async getLoginUrl(): Promise<string> {
    const response = await apiClient.post<LoginResponse>('/auth/login');
    return response.oauth_url;
  },
  logout(): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>('/auth/logout', {});
  },
  getBackendLoginEndpoint(): string {
    return `${getApiBaseUrl()}/auth/login`;
  },
};
