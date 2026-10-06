import { describe, expect, it } from "vitest";
import { clientAddress, isCrossSiteMutation } from "./request-guards";

function request(init: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  ip?: string;
}) {
  return {
    method: init.method ?? "POST",
    url: init.url ?? "http://localhost:3000/api/posts",
    headers: new Headers(init.headers),
    ip: init.ip
  };
}

describe("clientAddress", () => {
  it("uses the last forwarded hop", () => {
    expect(clientAddress(request({
      headers: { "x-forwarded-for": "1.1.1.1, 10.0.0.2" }
    }))).toBe("10.0.0.2");
  });

  it("falls back to the socket address", () => {
    expect(clientAddress(request({ ip: "127.0.0.1" }))).toBe("127.0.0.1");
  });
});

describe("isCrossSiteMutation", () => {
  it("rejects a foreign Origin and Sec-Fetch-Site cross-site", () => {
    expect(isCrossSiteMutation(request({
      headers: { origin: "https://evil.example" }
    }))).toBe(true);
    expect(isCrossSiteMutation(request({
      headers: { "sec-fetch-site": "cross-site" }
    }))).toBe(true);
  });

  it("allows same-origin mutations and non-browser requests", () => {
    expect(isCrossSiteMutation(request({
      headers: { origin: "http://localhost:3000", host: "localhost:3000" }
    }))).toBe(false);
    expect(isCrossSiteMutation(request({
      url: "http://0.0.0.0:3000/api/posts",
      headers: { origin: "http://localhost:3000", host: "localhost:3000" }
    }))).toBe(false);
    expect(isCrossSiteMutation(request({}))).toBe(false);
    expect(isCrossSiteMutation(request({
      method: "GET",
      headers: { origin: "https://evil.example" }
    }))).toBe(false);
  });
});
