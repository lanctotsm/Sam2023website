# Code review: design system + photo gallery

Reviewed 2026-07-31 on `feat/design-system-and-gallery`.
Scope: 36 modified files (+717 / −296) plus the new `components/gallery/`,
`lib/justifiedLayout.ts`, `drizzle/0007_add_image_lqip.sql`, `tests/gallery.spec.ts`,
and three new scripts.

Two independent passes went into this: a manual read-through and a
[Bugbot](b329f416-b835-4303-b526-08667ba96cc8) run over the branch diff. Bugbot
found three issues, one of which (the back-button bug) the manual pass had
already flagged — a useful cross-check that it is real.

## Verdict

The branch is in good shape. The design-token approach is the right call: the
`@layer base` heading restoration fixes all 67 headings without touching them
individually, and `surface-card` / `heading-rule` / `markdown-body` removed a lot
of duplicated utility strings rather than adding a parallel system. The
justified-layout algorithm is a pure function with 22 unit tests, which is
exactly where that complexity belongs.

**Nine issues were found. Seven are fixed and verified. Two are documented and
deliberately left alone**, both because they sit on the production deploy path
where an untested edit is worse than a known issue.

Verification after the fixes:

| Gate | Result |
| --- | --- |
| `npm run typecheck` | clean |
| `npm run lint` | 0 errors, 3 pre-existing warnings |
| `npm test` | 237 passed |
| `npx playwright test` | 33 passed (29 before, 4 added by this review) |
| `scripts/audit-responsive.mjs` | 130 pointer/viewport/page combinations, 0 issues |

---

## Fixed during review

### 1. Wheel-zoom `preventDefault()` was silently ignored — Lightbox

`onWheel` called `event.preventDefault()`, but React registers `wheel` as a
**passive** listener at the root, so the call did nothing and logged an error on
every single wheel event. Confirmed empirically before fixing:

```
transform before: translate3d(0px, 0px, 0px) scale(1)
transform after : translate3d(0px, 0px, 0px) scale(1.96)
console: error: Unable to preventDefault inside passive event listener invocation.
console: error: Unable to preventDefault inside passive event listener invocation.
```

So zoom worked, but the browser's own ctrl+wheel page zoom was never suppressed,
and the console filled with errors that would have shown up in any error
reporting you added later.

**Fix.** Bound `wheel` natively on the image stage with `{ passive: false }` and
dropped the React prop. Regression test added.

### 2. Browser Back left the album instead of closing the photo — AlbumViewer

Every URL update went through `history.replaceState`, which creates no history
entry. The `popstate` listener that was supposed to close the lightbox on Back
was therefore unreachable in the normal flow, and pressing Back navigated away
from the album entirely. On a phone, where Back is the primary "dismiss"
gesture, this was the wrong behaviour.

**Fix.** Opening the lightbox pushes exactly one entry; arrow navigation and the
filmstrip keep replacing it, so a hundred arrow presses still cost one Back.
Closing calls `history.back()` when we own that entry so both paths converge on
the same `popstate` handler. A `pushedEntry` ref distinguishes this from arriving
via a shared `?photo=` link, where there is no entry of ours to pop and Back
should still leave the page.

The risk here was the App Router hijacking the pop and re-rendering the route, so
this was verified rather than assumed — preserving `window.history.state` across
the push is what keeps the router's bookkeeping intact. Four tests now cover it:
Back closes and stays on the album, arrow presses do not stack entries, the
Close button behaves identically, and a deep link closes without navigating away.

### 3. Space key stolen from focused controls — Lightbox

The window-level key handler unconditionally consumed Space to toggle the
slideshow. After tabbing to Close or Download, pressing Space toggled the
slideshow instead of activating the focused control — a straightforward keyboard
accessibility break, made more visible by the fact that the dialog implements a
focus trap and therefore *encourages* tabbing. (Found by Bugbot.)

**Fix.** Space is ignored when the event target is inside a
`button, a[href], input, select, textarea`. Regression test added.

### 4. Touch targets were gated on viewport width, not pointer type

This is the one that mattered for the "usable at any screen size" requirement.
Controls shrank to their compact desktop size at `sm:`/`md:` breakpoints, so
**any touch device wide enough to get the desktop layout got mouse-sized
targets**: an iPhone in landscape is 844px wide, and it was receiving 41px nav
links, a 34px search input, a 36px theme toggle, and 28px gallery density
buttons.

The same width assumption also meant the search input dropped to `text-sm` on a
landscape phone, which re-introduces the iOS Safari auto-zoom-on-focus problem
that the `text-base` rule exists to prevent.

**Fix.** Added a `fine-pointer` variant (`@media (pointer: fine)`) and gated all
compact sizing behind it, stacked with the width breakpoint. Mouse users keep the
tighter density; anything with a coarse pointer keeps 44px regardless of width.
This also fails safe: a browser that does not support the `pointer` media feature
gets the large targets.

### 5. Small inline links were 20px tall — album and resume pages

"← Back to Albums" and the resume's email/LinkedIn/GitHub links were 20px tall
on every phone size tested (280px through 480px).

**Fix.** A `.tap-inline` component class: 24px minimum for mouse (the WCAG 2.5.8
floor), 44px on coarse pointers. Applied to those four links. Visual appearance
on desktop is unchanged.

### 6. Playwright specs raced each other through shared global state

Three tests failed locally and the cause was not the code under test:
`admin-settings.spec.ts` writes the global `site_title` setting, and
`basic.spec.ts` asserts on the rendered `<title>`. With `fullyParallel: true` and
default local workers, the files ran concurrently against **one** SQLite file and
**one** dev server, so `basic.spec.ts` observed the transient
`"Playwright Test Site"` value. The two lightbox failures were
`apiRequestContext.get: read ECONNRESET` from the same contention.

This was invisible in CI only because CI already pinned `workers: 1`, which made
it look like a local-environment quirk rather than a real ordering dependency.

**Fix.** `workers: 1` unconditionally, with a comment recording *why*. All 33
tests pass deterministically.

### 7. Blur-up state was keyed by array position — JustifiedGallery

The `loaded` set used the array index, so reordering an album (or any change to
the images array) would carry a "loaded" flag onto a different photo, showing a
not-yet-painted image at full opacity or hiding a painted one.

**Fix.** Keyed on `image.id`.

### 8. Redundant full copy of every uploaded file — image-processing

`processImage()` returned `Buffer.from(input)` as `original.buffer`, duplicating
the entire upload in memory. With `MAX_UPLOAD_BYTES` at 100 MB on a 512 MB
instance, that copy alone could be a fifth of available RAM, on top of the ~75 MB
of raw pixels a 25 MP decode needs. No caller mutates the buffer.

**Fix.** Passed `input` through directly. Existing test (`expect(result.original.buffer).toEqual(input)`)
still passes.

This is one item from a larger memory problem on the upload path, written up as
P3 in [`ARCHITECTURE_PROPOSAL.md`](./ARCHITECTURE_PROPOSAL.md).

---

## Recommended, deliberately not done

### 9. `npm rebuild better-sqlite3` in the deploy workflow does nothing useful — high

Found by Bugbot, in `.github/workflows/deploy-lightsail.yml:64`. The step runs
*after* `npm run build`, and the deploy rsyncs `.next/standalone`, which received
its own copy of `node_modules` during the build. Rebuilding in
`heron/node_modules` afterwards never touches the binary that actually ships, so
the step provides no protection against the ABI/glibc mismatch its comment says
it exists to prevent — while looking like it does.

Worth noting the step is somewhat misconceived regardless of ordering: rebuilding
on a GitHub runner produces a binary for the *runner's* glibc, not the Lightsail
VM's. The options are to rebuild on the instance after rsync, or to let the
already-approved Docker migration make the question moot by building and running
in the same image.

**Why I left it.** This is the live deploy path for your production site, and I
cannot test a deploy from here. A plausible-looking edit that breaks `pm2`
startup is strictly worse than a step that currently does nothing. It wants a
deliberate change with a deploy you watch.

### 10. Lightbox pan is unclamped

When zoomed, dragging can move the photo completely outside the viewport with no
visual indication of how to get back (the recovery is pressing `0`, which is not
discoverable). Clamping the translation to the scaled image's bounds is the fix,
but it needs the rendered dimensions and a set of gesture tests to do properly —
a focused change rather than a review drive-by.

---

## Smaller observations

- **`download` on a cross-origin URL is ignored.** The Lightbox's "Download
  original" link points at CloudFront, and browsers ignore the `download`
  attribute cross-origin, so it opens the image in a new tab instead of saving
  it. Needs `Content-Disposition` on the S3 object or a same-origin proxy route.
- **Preload cleanup sets `img.src = ""`**, which in some browsers issues a
  request against the current page URL. Dropping the reference is enough.
- **The filmstrip uses `role="tablist"` / `role="tab"` with no `tabpanel`.**
  A labelled group of buttons, or `listbox`/`option`, describes it more
  accurately.
- **Deep-linked photos never set `morphIndex`**, so closing a shared `?photo=`
  link does not morph back to its thumbnail. Cosmetic.
- **Two components write `document.body.style.overflow` directly** (Lightbox and
  Navigation's drawer). They cannot currently overlap, but if they ever do, one
  restore will clobber the other. A small shared scroll-lock counter would remove
  the hazard.
- **The site-title fallback is duplicated** in `app/layout.tsx` and
  `app/feed.xml/route.ts`. Worth collapsing — see
  [`REUSING_THIS_DESIGN.md`](./REUSING_THIS_DESIGN.md), where it becomes a
  profile field.
- **Three pre-existing lint warnings** remain: unused `eslint-disable` directives
  for `@next/next/no-page-custom-font` in `PageStyleProvider.tsx` and
  `NavStyleProvider.tsx`. `--fix` clears them; untouched here to keep this diff
  about the branch.

## Things worth keeping

Called out so they do not get "simplified" away later:

- **The pointer-based touch-target gating** is deliberate. `md:fine-pointer:min-h-0`
  looks redundant next to `md:min-h-0` and is not — see item 4.
- **`justifiedLayout.ts` is a pure function** with no React or DOM dependency,
  which is why it has 22 cheap unit tests including a determinism check and a
  358px phone-width packing case. Keep the layout maths out of the component.
- **LQIP as a base64 WebP data URI** rather than BlurHash avoids shipping a
  decoder to the client and needs no new dependency. The 24px/quality-40
  placeholders are around 200 bytes each.
- **`scripts/audit-responsive.mjs`** is the tool that caught items 4 and 5, and it
  is written to be reusable against any instance of this design. It is the
  cheapest way to check a re-theme.
