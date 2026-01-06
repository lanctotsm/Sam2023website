// Vitest setup file
import '@testing-library/jest-dom'

// Mock MUI icons to avoid file handle limits on Windows
vi.mock('@mui/icons-material', () => ({
  default: {},
  Collections: () => null,
  Add: () => null,
  Photo: () => null,
  ArrowBack: () => null,
  Close: () => null,
  NavigateBefore: () => null,
  NavigateNext: () => null,
  CloudUpload: () => null,
  Delete: () => null,
  Logout: () => null,
  Login: () => null,
}))

// Mock the API service to return default values
vi.mock('./services/api', () => ({
  apiService: {
    getAuthStatus: vi.fn().mockResolvedValue({ authenticated: false, user: null }),
    listAlbums: vi.fn().mockResolvedValue({ albums: [] }),
    listAlbumPhotos: vi.fn().mockResolvedValue({ photos: [] }),
    uploadPhoto: vi.fn().mockResolvedValue({}),
    createAlbum: vi.fn().mockResolvedValue({}),
    deleteAlbum: vi.fn().mockResolvedValue({}),
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    getImageUrl: vi.fn((key: string) => key),
  },
}))

// Suppress expected console errors during tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress expected auth status errors in tests
    if (typeof args[0] === 'string' && args[0].includes?.('Failed to get auth status')) {
      return
    }
    originalConsoleError.apply(console, args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
})
