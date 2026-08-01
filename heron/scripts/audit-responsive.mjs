/**
 * Sweeps every public page across a wide range of viewports and reports
 * anything that would make the site unusable at that size: horizontal
 * overflow, undersized touch targets, unreadable text, or clipped controls.
 *
 *   node scripts/audit-responsive.mjs [baseUrl]
 */

import { chromium } from "@playwright/test";

const BASE = process.argv[2] || "http://localhost:3000";

const VIEWPORTS = [
  { name: "fold-280", width: 280, height: 653 },
  { name: "iphone-se-320", width: 320, height: 568 },
  { name: "android-360", width: 360, height: 640 },
  { name: "iphone-14-390", width: 390, height: 844 },
  { name: "iphone-xr-414", width: 414, height: 896 },
  { name: "phablet-480", width: 480, height: 800 },
  { name: "phone-landscape-640", width: 640, height: 360 },
  { name: "ipad-portrait-768", width: 768, height: 1024 },
  { name: "phone-landscape-844", width: 844, height: 390 },
  { name: "ipad-landscape-1024", width: 1024, height: 768 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "fhd-1920", width: 1920, height: 1080 },
  { name: "qhd-2560", width: 2560, height: 1440 },
  { name: "uhd-3840", width: 3840, height: 2160 }
];

const PAGES = ["/", "/posts", "/albums", "/albums/sample-album", "/resume"];

/*
 * Touch input requires the 44px target minimum; mouse input only needs the
 * WCAG 2.5.8 floor of 24px, which is what the compact desktop density targets.
 */
const POINTERS = [
  { name: "touch", hasTouch: true, isMobile: true, minTarget: 44 },
  { name: "mouse", hasTouch: false, isMobile: false, minTarget: 24 }
];

const audit = (minTarget) => {
  const vw = window.innerWidth;
  const docWidth = document.documentElement.scrollWidth;

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return false;
    if (cs.opacity === "0") return false;
    // Skip the intentionally offscreen skip-link
    if (el.closest(".sr-only")) return false;
    if (cs.clip === "rect(0px, 0px, 0px, 0px)") return false;
    return true;
  };

  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className.slice(0, 44) : "";
    const text = (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").slice(0, 28);
    return `${el.tagName.toLowerCase()}${cls ? "." + cls.trim().split(/\s+/).slice(0, 2).join(".") : ""}${text ? ` "${text}"` : ""}`;
  };

  // Elements that physically extend past the right edge of the viewport
  const overflowing = [...document.querySelectorAll("body *")]
    .filter((el) => {
      if (!visible(el)) return false;
      const r = el.getBoundingClientRect();
      return r.right > vw + 1 && r.width <= docWidth;
    })
    .filter((el) => !el.closest("[data-nextjs-toast]") && !el.closest("nextjs-portal"))
    .map(describe)
    .slice(0, 6);

  // Interactive controls below the accessibility minimum for this pointer type
  const smallTargets = [...document.querySelectorAll("a, button, input, select, [role=tab]")]
    .filter((el) => {
      if (!visible(el)) return false;
      if (el.closest("nextjs-portal")) return false;
      const r = el.getBoundingClientRect();
      return r.height < minTarget || r.width < 24;
    })
    .map((el) => {
      const r = el.getBoundingClientRect();
      return `${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)}`;
    })
    .slice(0, 6);

  // Body copy that would be hard to read
  const tinyText = [...document.querySelectorAll("p, li, td, figcaption")]
    .filter((el) => {
      if (!visible(el) || !el.textContent.trim()) return false;
      return parseFloat(getComputedStyle(el).fontSize) < 12;
    })
    .map(describe)
    .slice(0, 4);

  const main = document.querySelector("main");
  const nav = document.querySelector("nav");
  const hamburger = nav?.querySelector('button[aria-label*="menu" i]');
  const navLinks = [...(nav?.querySelectorAll("a") ?? [])].filter(visible);

  return {
    viewportWidth: vw,
    docWidth,
    horizontalOverflow: docWidth > vw + 1,
    overflowing,
    smallTargets,
    tinyText,
    mainPaddingLeft: main ? getComputedStyle(main).paddingLeft : null,
    mainWidth: main ? Math.round(main.getBoundingClientRect().width) : null,
    navReachable: !!hamburger || navLinks.length > 0,
    h1: (() => {
      const h = document.querySelector("h1");
      return h ? Math.round(parseFloat(getComputedStyle(h).fontSize)) : null;
    })(),
    bodyFont: Math.round(parseFloat(getComputedStyle(document.body).fontSize))
  };
};

const problems = [];

const browser = await chromium.launch();

for (const pointer of POINTERS) {
  const context = await browser.newContext({
    hasTouch: pointer.hasTouch,
    isMobile: pointer.isMobile,
    viewport: { width: VIEWPORTS[0].width, height: VIEWPORTS[0].height }
  });
  const page = await context.newPage();

  for (const vp of VIEWPORTS) {
    // A real phone never reports a 4K viewport, so skip implausible pairings
    if (pointer.name === "touch" && vp.width > 1400) continue;

    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      // Give the client-measured gallery a chance to lay out
      await page.waitForTimeout(220);
      const r = await page.evaluate(audit, pointer.minTarget);

      const issues = [];
      if (r.horizontalOverflow) issues.push(`H-OVERFLOW doc=${r.docWidth} vw=${r.viewportWidth}`);
      if (r.overflowing.length) issues.push(`OVERFLOW-EL: ${r.overflowing.join(" | ")}`);
      if (r.smallTargets.length) issues.push(`SMALL-TARGET(<${pointer.minTarget}px): ${r.smallTargets.join(" | ")}`);
      if (r.tinyText.length) issues.push(`TINY-TEXT: ${r.tinyText.join(" | ")}`);
      if (!r.navReachable) issues.push("NAV-UNREACHABLE");

      const tag = `${pointer.name.padEnd(5)} ${vp.name.padEnd(22)} ${path.padEnd(24)}`;
      if (issues.length) {
        problems.push({ pointer: pointer.name, vp: vp.name, path, issues });
        console.log(`FAIL ${tag} h1=${r.h1} body=${r.bodyFont}`);
        issues.forEach((i) => console.log(`       ${i}`));
      } else {
        console.log(`ok   ${tag} h1=${r.h1} body=${r.bodyFont} main=${r.mainWidth} pad=${r.mainPaddingLeft}`);
      }
    }
  }

  await context.close();
}

await browser.close();

console.log(`\n${problems.length === 0 ? "PASS" : "PROBLEMS"}: ${problems.length} pointer/viewport/page combinations with issues`);
if (problems.length) {
  const byIssue = {};
  problems.forEach((p) =>
    p.issues.forEach((i) => {
      const kind = i.split(":")[0].split(" ")[0].split("(")[0];
      byIssue[kind] = (byIssue[kind] || 0) + 1;
    })
  );
  console.log("Breakdown:", JSON.stringify(byIssue));
  process.exitCode = 1;
}
