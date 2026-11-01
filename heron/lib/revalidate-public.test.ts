import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args)
}));

import { PUBLIC_CONTENT_TAG, revalidatePublicContent } from "./revalidate-public";

describe("revalidatePublicContent", () => {
  beforeEach(() => {
    revalidateTag.mockReset();
  });

  it("expires the public content tag", () => {
    revalidatePublicContent();
    expect(revalidateTag).toHaveBeenCalledWith(PUBLIC_CONTENT_TAG, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });

  it("ignores calls outside a Next.js request store", () => {
    revalidateTag.mockImplementation(() => {
      throw new Error("Invariant: static generation store missing in revalidateTag");
    });
    expect(() => revalidatePublicContent()).not.toThrow();
  });
});
