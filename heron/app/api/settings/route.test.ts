import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";
import { jsonRequest, getRequest, MOCK_AUTH_USER } from "../__tests__/helpers";

vi.mock("@/lib/api-utils", () => ({
    getAuthUser: vi.fn(),
    errorResponse: (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), { status })
}));

vi.mock("@/services/settings", () => ({
    getSetting: vi.fn(),
    getSettings: vi.fn(),
    updateSetting: vi.fn(),
    updateSettings: vi.fn()
}));

const { getAuthUser } = await import("@/lib/api-utils");
const { getSetting, getSettings, updateSetting, updateSettings } = await import("@/services/settings");

describe("SETTINGS /api/settings", () => {
    beforeEach(() => {
        vi.mocked(getAuthUser).mockResolvedValue(null);
        vi.mocked(getSetting).mockResolvedValue(null);
        vi.mocked(getSettings).mockResolvedValue({});
        vi.mocked(updateSetting).mockResolvedValue(undefined);
        vi.mocked(updateSettings).mockResolvedValue(undefined);
    });

    describe("GET", () => {
        it("returns 400 when no key or keys param given", async () => {
            const res = await GET(getRequest("http://localhost:3000/api/settings"));
            expect(res.status).toBe(400);
        });

        it("returns single setting by key", async () => {
            vi.mocked(getSetting).mockResolvedValue("My Site");
            const res = await GET(getRequest("http://localhost:3000/api/settings?key=site_title"));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual({ key: "site_title", value: "My Site" });
            expect(getSetting).toHaveBeenCalledWith("site_title");
        });

        it("returns null value for missing key", async () => {
            vi.mocked(getSetting).mockResolvedValue(null);
            const res = await GET(getRequest("http://localhost:3000/api/settings?key=missing"));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual({ key: "missing", value: null });
        });

        it("returns multiple settings by keys", async () => {
            vi.mocked(getSettings).mockResolvedValue({ site_title: "My Site", footer_text: "Footer" });
            const res = await GET(getRequest("http://localhost:3000/api/settings?keys=site_title,footer_text"));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual({ site_title: "My Site", footer_text: "Footer" });
            expect(getSettings).toHaveBeenCalledWith(["site_title", "footer_text"]);
        });
    });

    describe("PUT", () => {
        it("returns 401 when unauthenticated", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(null);
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/settings", { key: "site_title", value: "test" })
            );
            expect(res.status).toBe(401);
            expect(updateSetting).not.toHaveBeenCalled();
        });

        it("updates single setting when authenticated", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/settings", { key: "site_title", value: "New Title" })
            );
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual({ ok: true });
            expect(updateSetting).toHaveBeenCalledWith("site_title", "New Title");
        });

        it("batch updates multiple settings when authenticated", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/settings", {
                    settings: { site_title: "Title", footer_text: "Footer" }
                })
            );
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual({ ok: true });
            expect(updateSettings).toHaveBeenCalledWith({ site_title: "Title", footer_text: "Footer" });
        });

        it("returns 400 for invalid payload", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/settings", { foo: "bar" })
            );
            expect(res.status).toBe(400);
        });
    });
});
