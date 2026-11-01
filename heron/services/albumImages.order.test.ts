import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetDb } = vi.hoisted(() => ({
  mockGetDb: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  getDb: () => mockGetDb()
}));

import { updateAlbumImagesOrder } from "./albumImages";

describe("updateAlbumImagesOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies every sort-order update inside one transaction", async () => {
    const run = vi.fn();
    const where = vi.fn(() => ({ run }));
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    const tx = { update };
    const transaction = vi.fn((callback: (tx: typeof tx) => void) => callback(tx));
    mockGetDb.mockReturnValue({ transaction });

    await updateAlbumImagesOrder(1, [10, 20]);

    expect(transaction).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledTimes(2);
  });
});
