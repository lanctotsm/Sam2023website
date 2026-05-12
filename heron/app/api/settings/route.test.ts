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
        it("returns 401 when unauthenticated", async () => {
            const res = await GET(getRequest("http://localhost:3000/api/settings?key=site_title"));
            expect(res.status).toBe(401);
        });

        it("returns 400 when no key or keys param given", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const res = await GET(getRequest("http://localhost:3000/api/settings"));
            expect(res.status).toBe(400);
        });

        it("returns single setting by key", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            vi.mocked(getSetting).mockResolvedValue("My Site");
            const res = await GET(getRequest("http://localhost:3000/api/settings?key=site_title"));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual({ key: "site_title", value: "My Site" });
            expect(getSetting).toHaveBeenCalledWith("site_title");
        });

        it("returns null value for missing key", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            vi.mocked(getSetting).mockResolvedValue(null);
            const res = await GET(getRequest("http://localhost:3000/api/settings?key=missing_key"));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual({ key: "missing_key", value: null });
        });

        it("returns multiple settings by keys", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
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

        it("accepts page_backgrounds as a batch setting key", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const bgJson = JSON.stringify({ home: { backgroundType: "none", backgroundColor: "", backgroundImage: "", gradientFrom: "", gradientTo: "" }, albums: { backgroundType: "none", backgroundColor: "", backgroundImage: "", gradientFrom: "", gradientTo: "" }, posts: { backgroundType: "none", backgroundColor: "", backgroundImage: "", gradientFrom: "", gradientTo: "" }, resume: { backgroundType: "none", backgroundColor: "", backgroundImage: "", gradientFrom: "", gradientTo: "" } });
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/settings", { settings: { page_backgrounds: bgJson } })
            );
            expect(res.status).toBe(200);
            expect(updateSettings).toHaveBeenCalledWith({ page_backgrounds: bgJson });
        });

        it("accepts page_styles as a batch setting key", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const defaultEntry = { background: { backgroundType: "none", backgroundColor: "", backgroundImage: "", gradientFrom: "", gradientTo: "" }, style: { headingFont: "", bodyFont: "", h1Color: "", h1ColorDark: "", h2Color: "", h2ColorDark: "", bodyColor: "", bodyColorDark: "", linkColor: "", linkColorDark: "", cardBg: "", cardBgDark: "", cardBorder: "", cardBorderDark: "" } };
            const stylesJson = JSON.stringify({ home: defaultEntry, albums: defaultEntry, posts: defaultEntry, resume: defaultEntry });
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/settings", { settings: { page_styles: stylesJson } })
            );
            expect(res.status).toBe(200);
            expect(updateSettings).toHaveBeenCalledWith({ page_styles: stylesJson });
        });

        it("accepts nav_styles as a batch setting key", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const navJson = JSON.stringify({ bgColor: "red", font: "Inter" });
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/settings", { settings: { nav_styles: navJson } })
            );
            expect(res.status).toBe(200);
            expect(updateSettings).toHaveBeenCalledWith({ nav_styles: navJson });
        });

        it("rejects unknown setting keys even in batch", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(MOCK_AUTH_USER as never);
            const res = await PUT(
                jsonRequest("PUT", "http://localhost:3000/api/settings", { settings: { evil_key: "hack" } })
            );
            expect(res.status).toBe(400);
        });
    });
});
