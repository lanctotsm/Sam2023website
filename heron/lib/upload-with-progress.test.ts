import { describe, expect, it, vi } from "vitest";
import { postFormDataWithProgress } from "./upload-with-progress";

function createMockXhr(overrides?: {
  status?: number;
  responseText?: string;
  trigger?: "load" | "error";
      progress?: { loaded: number; total: number; lengthComputable?: boolean };
}) {
  const status = overrides?.status ?? 200;
  const responseText = overrides?.responseText ?? JSON.stringify({ ok: true });
  const trigger = overrides?.trigger ?? "load";
  const handlers: Record<string, EventListener> = {};
  const uploadHandlers: Record<string, EventListener> = {};

  const xhr = {
    status,
    responseText,
    withCredentials: false,
    upload: {
      addEventListener: (type: string, listener: EventListener) => {
        uploadHandlers[type] = listener;
      }
    },
    addEventListener: (type: string, listener: EventListener) => {
      handlers[type] = listener;
    },
    open: vi.fn(),
    send: vi.fn(() => {
      if (overrides?.progress) {
        uploadHandlers.progress?.(overrides.progress as unknown as Event);
      }
      if (trigger === "error") {
        handlers.error?.(new Event("error"));
        return;
      }
      handlers.load?.(new Event("load"));
    })
  };

  return xhr as unknown as XMLHttpRequest;
}

describe("postFormDataWithProgress", () => {
  it("parses JSON on a 2xx response", async () => {
    const xhr = createMockXhr({ responseText: JSON.stringify({ images: [1] }) });
    const result = await postFormDataWithProgress<{ images: number[] }>({
      url: "/api/images/upload",
      formData: new FormData(),
      createXhr: () => xhr
    });
    expect(result).toEqual({ images: [1] });
    expect(xhr.open).toHaveBeenCalledWith("POST", "/api/images/upload");
    expect(xhr.withCredentials).toBe(true);
  });

  it("rejects when the status is not 2xx", async () => {
    const xhr = createMockXhr({ status: 400, responseText: "too big" });
    await expect(
      postFormDataWithProgress({
        url: "/api/images/upload",
        formData: new FormData(),
        createXhr: () => xhr
      })
    ).rejects.toThrow("too big");
  });

  it("reports upload progress", async () => {
    const onProgress = vi.fn();
    const xhr = createMockXhr({
      progress: { loaded: 50, total: 100, lengthComputable: true }
    });
    await postFormDataWithProgress({
      url: "/api/images/upload",
      formData: new FormData(),
      onProgress,
      createXhr: () => xhr
    });
    expect(onProgress).toHaveBeenCalledWith(50);
  });
});
