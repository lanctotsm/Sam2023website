import '@testing-library/jest-dom';

const mockFetch = jest.fn();

beforeAll(() => {
  (global as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;
  process.env.REACT_APP_API_BASE_URL = 'http://localhost';
});

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => JSON.stringify({ authenticated: false }),
  });
});

afterEach(() => {
  mockFetch.mockReset();
});
