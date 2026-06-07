import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetDb, mockRevalidateTag } = vi.hoisted(() => ({
    mockGetDb: vi.fn(),
    mockRevalidateTag: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
    getDb: () => mockGetDb(),
}));

vi.mock("next/cache", () => ({
    unstable_cache: vi.fn((fn: unknown) => fn),
    revalidateTag: mockRevalidateTag,
}));

import { updateSettings, updateSetting } from "./settings";

function createSyncDbMock() {
    const run = vi.fn();
    const onConflictDoUpdate = vi.fn(() => ({ run }));
    const values = vi.fn(() => ({ onConflictDoUpdate }));
    const insert = vi.fn(() => ({ values }));
    const tx = { insert };
    const transaction = vi.fn((callback: (tx: typeof tx) => void) => callback(tx));
    return {
        db: { insert, transaction },
        mocks: { run, onConflictDoUpdate, values, insert, transaction },
    };
}

function createAsyncDbMock() {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn(() => ({ onConflictDoUpdate }));
    const insert = vi.fn(() => ({ values }));
    return {
        db: { insert },
        mocks: { onConflictDoUpdate, values, insert },
    };
}

describe("services/settings", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("updateSettings", () => {
        it("executes each upsert synchronously via .run() inside a transaction", async () => {
            const { db, mocks } = createSyncDbMock();
            mockGetDb.mockReturnValue(db);

            await updateSettings({ site_title: "Hello", footer_text: "World" });

            expect(mocks.transaction).toHaveBeenCalledOnce();
            expect(mocks.run).toHaveBeenCalledTimes(2);
        });

        it("calls revalidateTag with a single argument after persisting", async () => {
            const { db } = createSyncDbMock();
            mockGetDb.mockReturnValue(db);

            await updateSettings({ site_title: "Test" });

            expect(mockRevalidateTag).toHaveBeenCalledTimes(1);
            expect(mockRevalidateTag).toHaveBeenCalledWith("settings");
        });

        it("upserts each key-value pair via onConflictDoUpdate", async () => {
            const { db, mocks } = createSyncDbMock();
            mockGetDb.mockReturnValue(db);

            await updateSettings({ site_title: "My Title" });

            expect(mocks.onConflictDoUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    set: expect.objectContaining({ value: "My Title" }),
                })
            );
        });

        it("handles an empty entries object without throwing", async () => {
            const { db, mocks } = createSyncDbMock();
            mockGetDb.mockReturnValue(db);

            await expect(updateSettings({})).resolves.toBeUndefined();
            expect(mocks.run).not.toHaveBeenCalled();
        });
    });

    describe("updateSetting", () => {
        it("calls revalidateTag('settings') after persisting", async () => {
            const { db } = createAsyncDbMock();
            mockGetDb.mockReturnValue(db);

            await updateSetting("site_title", "Test");

            expect(mockRevalidateTag).toHaveBeenCalledTimes(1);
            expect(mockRevalidateTag).toHaveBeenCalledWith("settings");
        });
    });
});
