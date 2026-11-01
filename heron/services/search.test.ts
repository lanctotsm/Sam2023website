import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrepareAll } = vi.hoisted(() => ({
  mockPrepareAll: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  getRawDb: () => ({
    prepare: (sql: string) => ({
      all: (term: string) => mockPrepareAll(sql, term)
    })
  })
}));

vi.mock("@/lib/serializers", () => ({
  serializePost: (row: { id: number }) => ({ id: row.id, kind: "post" }),
  serializeAlbum: (row: { id: number }) => ({ id: row.id, kind: "album" })
}));

import { searchFts } from "./search";

const publishedPost = {
  id: 1,
  title: "Hit",
  slug: "hit",
  summary: "",
  markdown: "hello",
  status: "published",
  publishedAt: "2020-01-01T00:00:00.000Z",
  metadata: null,
  coverImageId: null,
  html: "<p>hello</p>",
  createdBy: 1,
  createdAt: "",
  updatedAt: ""
};

const publishedAlbum = {
  id: 4,
  title: "Harbor",
  slug: "harbor",
  description: "",
  status: "published",
  coverImageId: null,
  displayDate: null,
  createdBy: 1,
  createdAt: "",
  updatedAt: ""
};

describe("searchFts", () => {
  beforeEach(() => {
    mockPrepareAll.mockReset();
    mockPrepareAll.mockImplementation((sql: string) => {
      if (sql.includes("posts_fts")) return [publishedPost];
      if (sql.includes("albums_fts")) return [publishedAlbum];
      return [];
    });
  });

  it("omits a published post scheduled in the future", async () => {
    mockPrepareAll.mockImplementation((sql: string) => {
      if (sql.includes("posts_fts")) {
        return [{ ...publishedPost, publishedAt: "2099-01-01T00:00:00.000Z" }];
      }
      return [];
    });

    const result = await searchFts("hello");
    expect(result.posts).toEqual([]);
  });

  it("caps the bound FTS query at 100 characters", async () => {
    await searchFts(`${"a".repeat(150)}`);
    expect(mockPrepareAll).toHaveBeenCalledWith(expect.stringContaining("posts_fts"), "a".repeat(100));
  });

  it("requires published albums in the SQL before the result limit", async () => {
    await searchFts("harbor");
    const albumSql = mockPrepareAll.mock.calls.map((call) => String(call[0])).find((sql) => sql.includes("albums_fts"));
    expect(albumSql).toContain("albums.status = 'published'");
    expect(albumSql?.indexOf("albums.status")).toBeLessThan(albumSql?.indexOf("LIMIT") ?? -1);
  });

  it("returns the joined post and album without a per-hit lookup", async () => {
    const result = await searchFts("hello");
    expect(result.posts).toEqual([{ id: 1, kind: "post" }]);
    expect(result.albums).toEqual([{ id: 4, kind: "album" }]);
    expect(mockPrepareAll).toHaveBeenCalledTimes(2);
  });

  it("omits draft albums", async () => {
    mockPrepareAll.mockImplementation((sql: string) => {
      if (sql.includes("albums_fts")) return [{ ...publishedAlbum, status: "draft" }];
      return [];
    });

    const result = await searchFts("hello");
    expect(result.albums).toEqual([]);
  });
});
