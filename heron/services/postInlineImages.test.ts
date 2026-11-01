import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPostInlineImageIds,
  replacePostInlineImages,
  isImageReferencedByAnyPost
} from "./postInlineImages";

function createSelectDbMock(selectRows: { imageId: number }[] = []) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(selectRows)
      })
    })
  };
}

function createReplaceDbMock() {
  const run = vi.fn();
  const values = vi.fn(() => ({ run }));
  const insert = vi.fn(() => ({ values }));
  const where = vi.fn(() => ({ run }));
  const del = vi.fn(() => ({ where }));
  const tx = { insert, delete: del };
  const transaction = vi.fn((callback: (tx: typeof tx) => void) => callback(tx));
  return { db: { transaction }, mocks: { run, values, insert, del, transaction } };
}

const { mockGetDb } = vi.hoisted(() => ({ mockGetDb: vi.fn() }));

vi.mock("@/lib/db", () => ({
  getDb: () => mockGetDb()
}));

describe("services/postInlineImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDb.mockReturnValue(createSelectDbMock());
  });

  describe("getPostInlineImageIds", () => {
    it("returns empty array when no images linked", async () => {
      const ids = await getPostInlineImageIds(1);
      expect(ids).toEqual([]);
    });

    it("returns image ids when rows exist", async () => {
      mockGetDb.mockReturnValue(createSelectDbMock([{ imageId: 10 }, { imageId: 20 }]));

      const ids = await getPostInlineImageIds(5);
      expect(ids).toEqual([10, 20]);
    });
  });

  describe("replacePostInlineImages", () => {
    it("deletes existing and inserts new ids", async () => {
      const { db, mocks } = createReplaceDbMock();
      mockGetDb.mockReturnValue(db);

      await replacePostInlineImages(1, [10, 20, 30]);

      expect(mocks.values).toHaveBeenCalledWith(
        expect.arrayContaining([
          { postId: 1, imageId: 10, source: "upload_insert" },
          { postId: 1, imageId: 20, source: "upload_insert" },
          { postId: 1, imageId: 30, source: "upload_insert" }
        ])
      );
    });

    it("deduplicates and filters invalid ids", async () => {
      const { db, mocks } = createReplaceDbMock();
      mockGetDb.mockReturnValue(db);

      await replacePostInlineImages(2, [5, 5, 0, -1, 3.14, 7]);

      expect(mocks.values).toHaveBeenCalledWith([
        { postId: 2, imageId: 5, source: "upload_insert" },
        { postId: 2, imageId: 7, source: "upload_insert" }
      ]);
    });

    it("does not insert when ids array is empty after filtering", async () => {
      const { db, mocks } = createReplaceDbMock();
      mockGetDb.mockReturnValue(db);

      await replacePostInlineImages(3, [0, -1]);

      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it("runs delete and insert inside a single transaction", async () => {
      const { db, mocks } = createReplaceDbMock();
      mockGetDb.mockReturnValue(db);

      await replacePostInlineImages(1, [10, 20]);

      expect(mocks.transaction).toHaveBeenCalledOnce();
      expect(mocks.run).toHaveBeenCalledTimes(2);
    });
  });

  describe("isImageReferencedByAnyPost", () => {
    it("returns false when no references", async () => {
      const result = await isImageReferencedByAnyPost(99);
      expect(result).toBe(false);
    });

    it("returns true when referenced", async () => {
      mockGetDb.mockReturnValue(createSelectDbMock([{ imageId: 99 }]));

      const result = await isImageReferencedByAnyPost(99);
      expect(result).toBe(true);
    });
  });
});
