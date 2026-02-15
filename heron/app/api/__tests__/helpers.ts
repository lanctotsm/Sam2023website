export const MOCK_AUTH_USER = {
  id: 1,
  email: "test@example.com",
  role: "admin"
};

export function jsonRequest(
  method: string,
  url: string,
  body?: object
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
}

export function getRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

export function getParams<T extends Record<string, string>>(params: T) {
  return Promise.resolve(params);
}
