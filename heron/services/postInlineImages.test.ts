import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPostInlineImageIds,
  replacePostInlineImages,
  isImageReferencedByAnyPost
} from "./postInlineImages";

function createDbMock(overrides?: {
  selectRows?: { imageId: number }[];
  deleteWhere?: ReturnType<typeof vi.fn>;
  insertValues?: ReturnType<typeof vi.fn>;
}) {
  const selectRows = overrides?.selectRows ?? [];
  const deleteWhere = overrides?.deleteWhere ?? vi.fn().mockResolvedValue(undefined);
  const insertValues = overrides?.insertValues ?? vi.fn().mockResolvedValue(undefined);

  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(selectRows)
      })
    }),
    delete: vi.fn().mockReturnValue({ where: deleteWhere }),
    insert: vi.fn().mockReturnValue({ values: insertValues })
  };
}

const { mockGetDb } = vi.hoisted(() => ({ mockGetDb: vi.fn() }));

vi.mock("@/lib/db", () => ({
  getDb: () => mockGetDb()
}));

describe("services/postInlineImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDb.mockReturnValue(createDbMock());
  });

  describe("getPostInlineImageIds", () => {
    it("returns empty array when no images linked", async () => {
      const ids = await getPostInlineImageIds(1);
      expect(ids).toEqual([]);
    });

    it("returns image ids when rows exist", async () => {
      mockGetDb.mockReturnValue(createDbMock({ selectRows: [{ imageId: 10 }, { imageId: 20 }] }));

      const ids = await getPostInlineImageIds(5);
      expect(ids).toEqual([10, 20]);
    });
  });

  describe("replacePostInlineImages", () => {
    it("deletes existing and inserts new ids", async () => {
      const deleteWhere = vi.fn().mockResolvedValue(undefined);
      const insertValues = vi.fn().mockResolvedValue(undefined);
      mockGetDb.mockReturnValue(createDbMock({ deleteWhere, insertValues }));

      await replacePostInlineImages(1, [10, 20, 30]);

      expect(deleteWhere).toHaveBeenCalled();
      expect(insertValues).toHaveBeenCalledWith(
        expect.arrayContaining([
          { postId: 1, imageId: 10, source: "upload_insert" },
          { postId: 1, imageId: 20, source: "upload_insert" },
          { postId: 1, imageId: 30, source: "upload_insert" }
        ])
      );
    });

    it("deduplicates and filters invalid ids", async () => {
      const insertValues = vi.fn().mockResolvedValue(undefined);
      mockGetDb.mockReturnValue(createDbMock({ insertValues }));

      await replacePostInlineImages(2, [5, 5, 0, -1, 3.14, 7]);

      expect(insertValues).toHaveBeenCalledWith([
        { postId: 2, imageId: 5, source: "upload_insert" },
        { postId: 2, imageId: 7, source: "upload_insert" }
      ]);
    });

    it("does not insert when ids array is empty after filtering", async () => {
      const insertValues = vi.fn().mockResolvedValue(undefined);
      mockGetDb.mockReturnValue(createDbMock({ insertValues }));

      await replacePostInlineImages(3, [0, -1]);

      expect(insertValues).not.toHaveBeenCalled();
    });
  });

  describe("isImageReferencedByAnyPost", () => {
    it("returns false when no references", async () => {
      const result = await isImageReferencedByAnyPost(99);
      expect(result).toBe(false);
    });

    it("returns true when referenced", async () => {
      mockGetDb.mockReturnValue(createDbMock({ selectRows: [{ imageId: 99 }] }));

      const result = await isImageReferencedByAnyPost(99);
      expect(result).toBe(true);
    });
  });
});
