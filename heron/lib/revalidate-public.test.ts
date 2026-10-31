import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const revalidateTag = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
  revalidateTag: (...args: unknown[]) => revalidateTag(...args)
}));

import { PUBLIC_CONTENT_TAG, revalidatePublicContent } from "./revalidate-public";

describe("revalidatePublicContent", () => {
  beforeEach(() => {
    revalidatePath.mockReset();
    revalidateTag.mockReset();
  });

  it("expires the content tag and the public routes", () => {
    revalidatePublicContent();
    expect(revalidateTag).toHaveBeenCalledWith(PUBLIC_CONTENT_TAG, { expire: 0 });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/posts");
    expect(revalidatePath).toHaveBeenCalledWith("/posts/[slug]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/albums");
    expect(revalidatePath).toHaveBeenCalledWith("/albums/[slug]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/feed.xml");
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("ignores calls outside a Next.js request store", () => {
    revalidateTag.mockImplementation(() => {
      throw new Error("Invariant: static generation store missing in revalidateTag");
    });
    expect(() => revalidatePublicContent()).not.toThrow();
  });
});
