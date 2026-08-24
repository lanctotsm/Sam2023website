import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetDb } = vi.hoisted(() => ({
  mockGetDb: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  getDb: () => mockGetDb()
}));

import { addAlbumImage } from "./albumImages";

describe("addAlbumImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts sort order when the album/image pair already exists", async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn(() => ({ onConflictDoUpdate }));
    const insert = vi.fn(() => ({ values }));
    mockGetDb.mockReturnValue({ insert });

    await addAlbumImage(1, 2, 3);

    expect(values).toHaveBeenCalledWith({ albumId: 1, imageId: 2, sortOrder: 3 });
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: { sortOrder: 3 }
      })
    );
  });
});
