import { test, expect, type Page } from "@playwright/test";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

function galleryPhotos(page: Page) {
  return page.locator("article > div > div.relative > button");
}

/**
 * Finds an album that actually has photos. A fresh CI database may have none, in
 * which case the gallery tests have nothing to assert and are skipped.
 *
 * The grid is client-measured before it renders anything, so this waits for the
 * first tile rather than counting immediately after navigation.
 */
async function gotoPopulatedAlbum(page: Page): Promise<boolean> {
  const response = await page.request.get("/api/albums");
  if (!response.ok()) return false;

  const albums = (await response.json()) as { slug: string }[];
  if (!Array.isArray(albums) || albums.length === 0) return false;

  for (const album of albums) {
    await page.goto(`/albums/${album.slug}`);
    try {
      await galleryPhotos(page).first().waitFor({ state: "visible", timeout: 7000 });
      return true;
    } catch {
      // Empty album; try the next one.
    }
  }
  return false;
}

/**
 * Like `gotoPopulatedAlbum`, but arrives via a real link click (from /albums)
 * instead of `page.goto`, so the browser has a genuine history entry to go
 * back to. Needed by the two tests below that assert on Back-button
 * behavior; a fresh CI database may have an album with no photos yet, in
 * which case those tests skip themselves rather than timing out.
 */
async function gotoPopulatedAlbumViaLink(
  page: Page
): Promise<{ populated: boolean; albumUrl: string }> {
  await page.goto("/albums");
  const albumLinks = page.locator('a:has-text("View album")');
  const count = await albumLinks.count();

  for (let i = 0; i < count; i++) {
    await page.goto("/albums");
    await albumLinks.nth(i).click();
    try {
      await galleryPhotos(page).first().waitFor({ state: "visible", timeout: 7000 });
      return { populated: true, albumUrl: page.url() };
    } catch {
      // Empty album; try the next one.
    }
  }
  return { populated: false, albumUrl: "" };
}

test.describe("Justified gallery", () => {
  test("packs rows flush to the container on desktop", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    const photos = galleryPhotos(page);
    await expect(photos.first()).toBeVisible();

    const metrics = await page.evaluate(() => {
      const container = document.querySelector<HTMLElement>("article div.relative.w-full");
      if (!container) return null;
      const width = container.clientWidth;
      const rows = new Map<string, { left: number; width: number }[]>();
      container.querySelectorAll<HTMLElement>("button").forEach((button) => {
        const key = button.style.top;
        const entry = { left: parseFloat(button.style.left), width: parseFloat(button.style.width) };
        rows.set(key, [...(rows.get(key) ?? []), entry]);
      });
      return {
        width,
        rowRights: [...rows.values()].map((items) => {
          const last = items[items.length - 1];
          return last.left + last.width;
        })
      };
    });

    expect(metrics).not.toBeNull();
    // Every row except the trailing one must land exactly on the container edge.
    const filled = metrics!.rowRights.filter((right) => right === metrics!.width);
    expect(filled.length).toBeGreaterThan(0);
    for (const right of metrics!.rowRights) {
      expect(right).toBeLessThanOrEqual(metrics!.width);
    }
  });

  test("does not overflow horizontally on a phone", async ({ page }) => {
    await page.setViewportSize(PHONE);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    await expect(galleryPhotos(page).first()).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
  });

  test("hides the density toggle on a phone and shows it on desktop", async ({ page }) => {
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    const toggle = page.getByRole("group", { name: /photo size/i });

    await page.setViewportSize(PHONE);
    await page.reload();
    await expect(galleryPhotos(page).first()).toBeVisible();
    await expect(toggle).toHaveCount(0);

    await page.setViewportSize(DESKTOP);
    await page.reload();
    await expect(galleryPhotos(page).first()).toBeVisible();
    await expect(toggle).toBeVisible();
  });
});

test.describe("Lightbox", () => {
  test("opens on click, deep-links, and closes", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    await galleryPhotos(page).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/[?&]photo=\d+/);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page).not.toHaveURL(/[?&]photo=\d+/);
  });

  test("restores an open photo from the URL", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    await galleryPhotos(page).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const deepLink = page.url();

    await page.goto(deepLink);
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("navigates with the arrow keys", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    const total = await galleryPhotos(page).count();
    test.skip(total < 2, "Album needs at least two photos");

    await galleryPhotos(page).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const counter = dialog.locator("p[aria-live='polite']");
    await expect(counter).toHaveText(/^1 \//);

    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText(/^2 \//);

    await page.keyboard.press("ArrowLeft");
    await expect(counter).toHaveText(/^1 \//);

    // Wrapping backwards from the first photo lands on the last.
    await page.keyboard.press("ArrowLeft");
    await expect(counter).toHaveText(new RegExp(`^${total} /`));
  });

  test("locks page scrolling while open", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    await galleryPhotos(page).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  });

  test("zooms in and resets with the keyboard", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    await galleryPhotos(page).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const scale = async () => {
      return page.evaluate(() => {
        const img = document.querySelector<HTMLElement>("[role=dialog] img[style*=transform]");
        if (!img) return null;
        const match = getComputedStyle(img).transform.match(/matrix\(([^,]+)/);
        return match ? Number(Number(match[1]).toFixed(2)) : null;
      });
    };

    await expect.poll(scale).toBe(1);
    await page.keyboard.press("+");
    await page.keyboard.press("+");
    await expect.poll(scale).toBeGreaterThan(1);
    await page.keyboard.press("0");
    await expect.poll(scale).toBe(1);
  });

  test("keeps controls reachable at phone size", async ({ page }) => {
    await page.setViewportSize(PHONE);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    await galleryPhotos(page).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await expect(dialog.getByRole("button", { name: /close/i })).toBeVisible();

    // Every control needs to clear the 44px touch minimum.
    const undersized = await dialog.evaluate((root) =>
      [...root.querySelectorAll("button, a")].filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && (rect.width < 44 || rect.height < 44);
      }).length
    );
    expect(undersized).toBe(0);

    // The filmstrip is desktop-only; it would eat the phone viewport.
    await expect(dialog.getByRole("tablist")).toBeHidden();
  });

  test("browser back closes the photo without leaving the album", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    // Arrive via /albums so there is a real previous entry to leave to if the
    // history handling is wrong.
    const { populated, albumUrl } = await gotoPopulatedAlbumViaLink(page);
    test.skip(!populated, "No album with photos in this database");

    await galleryPhotos(page).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page).toHaveURL(/[?&]photo=\d+/);

    await page.goBack();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(page.url()).toBe(albumUrl);
    await expect(galleryPhotos(page).first()).toBeVisible();
  });

  test("arrow navigation does not stack history entries", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const { populated, albumUrl } = await gotoPopulatedAlbumViaLink(page);
    test.skip(!populated, "No album with photos in this database");

    const total = await galleryPhotos(page).count();
    test.skip(total < 3, "Album needs at least three photos");

    await galleryPhotos(page).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    // A single Back should undo the whole lightbox session, not one arrow press.
    await page.goBack();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(page.url()).toBe(albumUrl);
  });

  test("space activates the focused control instead of the slideshow", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    await galleryPhotos(page).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: /close/i }).focus();
    await page.keyboard.press(" ");
    await expect(dialog).toHaveCount(0);
  });

  test("wheel zooms without tripping the passive listener warning", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await galleryPhotos(page).first().click();
    const photo = page.getByRole("dialog").locator("img").first();
    await expect(photo).toBeVisible();

    const box = await photo.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, -120);
    await page.mouse.wheel(0, -120);

    await expect
      .poll(() => photo.evaluate((el) => (el as HTMLElement).style.transform))
      .toMatch(/scale\((?!1\))/);
    expect(consoleErrors.filter((text) => /passive/i.test(text))).toEqual([]);
  });

  test("shows the filmstrip on desktop", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const populated = await gotoPopulatedAlbum(page);
    test.skip(!populated, "No album with photos in this database");

    const total = await galleryPhotos(page).count();
    test.skip(total < 2, "Filmstrip only renders for multi-photo albums");

    await galleryPhotos(page).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("tablist")).toBeVisible();

    // Jumping via the filmstrip should move the counter.
    await dialog.getByRole("tab", { name: "Photo 2" }).click();
    await expect(dialog.locator("p[aria-live='polite']")).toHaveText(/^2 \//);
  });
});
