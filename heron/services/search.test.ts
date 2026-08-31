import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrepareAll, mockGetPostById } = vi.hoisted(() => ({
  mockPrepareAll: vi.fn(),
  mockGetPostById: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  getRawDb: () => ({
    prepare: () => ({ all: mockPrepareAll })
  })
}));

vi.mock("@/services/posts", () => ({
  getPostById: mockGetPostById
}));

vi.mock("@/services/albums", () => ({
  getAlbumById: vi.fn().mockResolvedValue(null)
}));

vi.mock("@/lib/serializers", () => ({
  serializePost: (row: { id: number }) => ({ id: row.id }),
  serializeAlbum: (row: unknown) => row
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
  createdBy: 1,
  createdAt: "",
  updatedAt: ""
};

describe("searchFts", () => {
  beforeEach(() => {
    mockPrepareAll.mockReset();
    mockGetPostById.mockReset();
    mockPrepareAll.mockReturnValue([{ id: 1 }]);
  });

  it("omits a published post scheduled in the future", async () => {
    mockGetPostById.mockResolvedValue({
      ...publishedPost,
      publishedAt: "2099-01-01T00:00:00.000Z"
    });

    const result = await searchFts("hello");
    expect(result.posts).toEqual([]);
  });

  it("includes a published post whose publishedAt is in the past", async () => {
    mockGetPostById.mockResolvedValue(publishedPost);

    const result = await searchFts("hello");
    expect(result.posts).toEqual([{ id: 1 }]);
  });
});
