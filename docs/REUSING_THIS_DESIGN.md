# Reusing this design for a second personal site

Written 2026-07-31, for standing up a site for another person from this codebase.

## The short version

The design is already almost entirely token-driven. The colour palette is
fourteen CSS custom properties in a single `@theme` block, the type scale is six
`clamp()` expressions, and every component reads from those tokens rather than
hardcoding values. Nothing in the layout, spacing, or responsive behaviour is
tied to the warm earthy palette.

**A completely different-looking site is about a thirty-line CSS diff plus two
font names.** The expensive parts — the fluid type scale, the responsive
gutters, the touch-target rules, the safe-area handling, the gallery, the
lightbox — carry over untouched.

What is *not* reusable as-is is the content: the resume page is hardcoded, and
several fallback strings say "Samuel Lanctot". Those are listed precisely in
[What is hardcoded](#what-is-hardcoded) below, and there are about a dozen.

---

## What you actually have

### The theme layer, in `heron/app/globals.css`

Everything visual flows from one `@theme` block:

- **Brand colours** — `--color-chestnut{,-dark,-light}`, `--color-olive{,-dark,-light}`,
  `--color-desert-tan{,-light,-dark}`, `--color-caramel{,-light}`, `--color-copper{,-light}`
- **Neutrals** — `--color-canvas`, `--color-surface`, `--color-surface-hover`, `--color-hairline`
- **Dark-mode neutrals** — the same set prefixed `--color-dark-*`
- **Type scale** — `--text-display`, `--text-h1` … `--text-body`, each a `clamp()`
  that interpolates between a phone minimum and a desktop maximum
- **Elevation** — `--shadow-card`, `--shadow-card-hover`

### The component layer, also in `globals.css`

Five classes carry the visual identity, and every page uses them instead of
repeating utility strings:

| Class | Responsibility |
| --- | --- |
| `.surface-card` | Card background, border, radius, shadow, and responsive padding (1.125rem → 1.5rem → 2rem) |
| `.heading-rule` | The small accent bar under section headings, auto-centering under centered text |
| `.tap-target` | Guarantees a 44×44px hit area without changing visual size |
| `.tap-inline` | 24px minimum for mouse, 44px on touch, for small standalone links |
| `.markdown-body` | All rich-text styling: headings, lists, quotes, code, tables, images |

Plus a `@layer base` block that restores heading sizes on top of Tailwind's
Preflight reset, so headings are correct by default and no page needs explicit
`text-3xl`-style classes.

### The runtime-configurable layer, in the database

A meaningful amount of per-site customisation needs **no code changes at all**,
because it is already stored in the `settings` table and editable from
`/admin/settings`:

| Setting key | What it controls |
| --- | --- |
| `site_title` | `<title>`, RSS feed title |
| `footer_text` | Footer copyright line |
| `front_page` | The **entire homepage**, as an ordered list of section objects |
| `page_styles` | Per-page heading font, body font, and eight colour overrides, light and dark |
| `nav_styles` | Navigation background, text, and accent colours, and font |

The homepage in particular is fully data-driven: `front_page` is a JSON array of
sections, each with a `templateId` resolved against the templates in
`heron/components/home/templates/` (`banner`, `text-block`, `card-grid`,
`tag-list`, `contact`). A different person's homepage is a different JSON blob,
authored through the admin UI — not a code change.

---

## Three ways to do this, and which one to pick

### Option A — Fork the repository

Copy the repo, rip out the personal content, re-theme, deploy separately.

*Good:* immediately understandable, zero abstraction, the two sites can diverge
however they like.
*Bad:* every bug fix and improvement has to be cherry-picked by hand, forever.
In practice the fork stops receiving fixes after a few months.

### Option B — Extract a shared UI package

Publish `globals.css` and the shared components as a private npm package that
both sites depend on.

*Good:* one source of truth, proper versioning.
*Bad:* you now maintain a package, a release process, and a peer-dependency
matrix, to serve two websites. The abstraction cost is permanent and the benefit
is small at this scale. Revisit at four or five sites.

### Option C — One codebase, two site profiles ✅ recommended

Keep one repository. Add a `site.config.ts` per site, select it with an
environment variable, and deploy the same build twice.

*Good:* fixes land in both sites at once with no cherry-picking and no package
to maintain. It also composes directly with P6 in
[`ARCHITECTURE_PROPOSAL.md`](./ARCHITECTURE_PROPOSAL.md): one Docker image, two
containers on one instance, marginal hosting cost $0.
*Bad:* the two sites cannot diverge structurally without the config surface
growing. For two personal sites that is a non-issue.

The rest of this document assumes Option C. If your brother wants full
independence, do Option A and read the [What is hardcoded](#what-is-hardcoded)
section as your checklist instead.

---

## Option C, step by step

### 1. Introduce a site profile

Create `heron/site/profiles/` with one file per site, and a resolver that picks
one from `SITE_PROFILE` (defaulting to the existing site so nothing breaks):

```ts
// heron/site/types.ts
export type SiteProfile = {
  id: string;
  title: string;
  description: string;
  footerName: string;
  themeColor: { light: string; dark: string };
  fonts: { display: string; body: string };
  nav: { href: string; label: string; authOnly?: boolean }[];
  /** Rendered by app/resume/page.tsx; omit the key to hide the page. */
  resume?: ResumeContent;
  social: { email?: string; github?: string; linkedin?: string };
};
```

```ts
// heron/site/index.ts
import { samProfile } from "./profiles/sam";
import { brotherProfile } from "./profiles/brother";

const profiles = { sam: samProfile, brother: brotherProfile };

export const site =
  profiles[(process.env.SITE_PROFILE ?? "sam") as keyof typeof profiles] ?? samProfile;
```

Then replace the hardcoded strings listed below with reads from `site`. This is
a mechanical change and it is the bulk of the work — budget an hour or two.

### 2. Make the resume page data-driven

`heron/app/resume/page.tsx` is the only page with hardcoded prose. Move the
name, location, contact links, job history, skills, and summary bullets into
`SiteProfile.resume`, and have the page map over them. The markup already uses
the design tokens, so nothing about its appearance needs to change.

If your brother does not want a resume page, make `resume` optional and
`notFound()` when it is absent — and drop the entry from `site.nav`.

### 3. Swap the palette

This is the part that makes it look like a different site. Replace the brand
colours and neutrals in the `@theme` block. **Keep the variable names.** Every
component references `--color-chestnut` and friends by name, so renaming them
means touching a hundred call sites for zero benefit; treat the names as slots,
not as colour descriptions.

A worked example follows.

### 4. Deploy it

Same image, second container, second Caddy site block, `SITE_PROFILE=brother`,
its own `CMS_DB_PATH`, and its own S3 key prefix. See P6 in the architecture
proposal for the sizing implications — 512 MB is not enough for two sites, so
move to the $7 `micro` bundle.

---

## A worked example: "Slate & Teal"

Cool and technical, where the current site is warm and earthy. Every value below
was checked with the WCAG contrast formula; the ratios are real, not estimates.

```css
@theme {
  /* Slots that were chestnut - now deep slate blue */
  --color-chestnut: #14304a;
  --color-chestnut-dark: #0d2033;
  --color-chestnut-light: #1f4a6b;

  /* Slots that were olive - now cool grey, used for muted text */
  --color-olive: #4a5c68;
  --color-olive-dark: #33424c;
  --color-olive-light: #7d909c;

  /* Slots that were desert tan - now pale steel, used for nav text on dark */
  --color-desert-tan: #e8eef2;
  --color-desert-tan-light: #f4f8fa;
  --color-desert-tan-dark: #d3e0e8;

  /* Slots that were caramel - the accent bar and active nav pill */
  --color-caramel: #1f8a7a;
  --color-caramel-light: #3fb8a6;

  /* Slots that were copper - link text */
  --color-copper: #0a6674;
  --color-copper-light: #17705f;

  --color-canvas: #f1f5f8;
  --color-surface: #fafcfd;
  --color-surface-hover: #eaf1f5;
  --color-hairline: #d3e0e8;

  --color-dark-canvas: #121619;
  --color-dark-bg: #161c21;
  --color-dark-surface: #1b2126;
  --color-dark-surface-hover: #232b31;
  --color-dark-hairline: #2f3a42;
  --color-dark-text: #dde7ee;
  --color-dark-muted: #93a6b3;
}
```

Measured contrast against `--color-surface` (#fafcfd) in light mode, and against
`--color-dark-surface` (#1b2126) in dark mode:

| Token | Used for | Ratio | Result |
| --- | --- | --- | --- |
| `--color-chestnut` #14304a | Headings | 13.15:1 | Passes AAA |
| `--color-chestnut-light` #1f4a6b | Secondary headings | 9.07:1 | Passes AAA |
| `--color-olive` #4a5c68 | Muted body text | 6.75:1 | Passes AA |
| `--color-copper` #0a6674 | Links | 6.45:1 | Passes AA |
| `--color-caramel` #1f8a7a | Accent bar, active pill | 3.85:1 on canvas | Passes AA for **graphics only** |
| `--color-dark-text` #dde7ee | Dark-mode body | 12.95:1 | Passes AAA |
| `--color-dark-muted` #93a6b3 | Dark-mode muted | 6.46:1 | Passes AA |
| `--color-caramel-light` #3fb8a6 | Dark-mode links/accent | 6.67:1 | Passes AA |
| `--color-desert-tan` #e8eef2 | Nav text on `--color-chestnut` | 11.57:1 | Passes AAA |

**One caveat, and it matters.** `--color-caramel` at 3.85:1 clears the 3:1 bar
for non-text graphics, which is how it is used today — the `heading-rule` bar and
the active nav pill background. It does **not** clear 4.5:1, so do not start
using it as body text in light mode. `--color-copper-light` (#17705f, 5.44:1 on
canvas) is the text-safe version of the same hue if you need one.

Pair it with a different typeface to complete the change. The current site uses
Fraunces for display and Inter for body; something like Space Grotesk over Inter,
or Newsreader over Source Sans, will read as a different site entirely. Add the
display font to `AVAILABLE_FONTS` in `heron/lib/fonts.ts` so it also appears in
the admin font pickers.

---

## What is hardcoded

The complete list of places a person's identity is baked in. For Option A this
is your checklist; for Option C these are the call sites that become `site.*`
reads.

| File | What is there |
| --- | --- |
| `heron/app/resume/page.tsx` | Name, location, email, GitHub and LinkedIn URLs, two jobs, all skills, all summary bullets |
| `heron/lib/frontPage.ts` | The default homepage: bio paragraphs, "What I Do" cards, interests, contact links. Overridden at runtime by the `front_page` setting, so this only affects a fresh database |
| `heron/components/Footer.tsx` | Fallback copyright name; also the `footerLinks` array |
| `heron/components/Navigation.tsx` | The `navItems` array |
| `heron/app/layout.tsx` | Fallback title `"Sam's website"`, `description: "Modern SQLite CMS"`, the two `themeColor` hexes (which must match `--color-canvas` and `--color-dark-canvas`) |
| `heron/app/feed.xml/route.ts` | The same fallback title, duplicated |
| `heron/app/globals.css` | The palette |
| `heron/lib/fonts.ts` | `AVAILABLE_FONTS`, the list offered in the admin font pickers |
| `heron/scripts/seed.ts` | Seed content, including "Sample Album" |

Note the duplicated title fallback across `layout.tsx` and `feed.xml/route.ts` —
worth collapsing into the profile regardless of which option you choose.

---

## Invariants: do not break these while re-theming

These are load-bearing responsive rules. They are easy to break by accident and
the breakage only shows up on a real phone.

**1. The gutters and the full-bleed banner are coupled.** `<main>` uses
`px-4 sm:px-6 lg:px-8`, and `BannerSection` cancels it with
`-mx-4 sm:-mx-6 lg:-mx-8` to reach the screen edge. Change one and you must
change the other, or the banner will be inset or will cause horizontal overflow.

**2. Touch targets are gated on pointer type, not width.** The `fine-pointer`
variant (defined at the top of `globals.css` as `@media (pointer: fine)`) is what
lets controls shrink to their compact desktop size. This is deliberate: a phone
in landscape is 844px wide and therefore receives the desktop layout, but it is
still a thumb. Do not "simplify" `md:fine-pointer:min-h-0` back to
`md:min-h-0`.

**3. Text inputs must stay at `text-base` on touch.** iOS Safari auto-zooms the
page when focusing an input whose font is under 16px. `SearchBar` only drops to
`text-sm` behind `sm:fine-pointer:`, for exactly this reason.

**4. Use `100svh` / `100dvh`, never `100vh`.** `100vh` on mobile Safari includes
the browser chrome, so a `100vh` element is taller than the screen and the page
scrolls when it should not. `<main>` uses `min-h-[calc(100svh-4rem)]`; the
lightbox uses `100dvh`.

**5. Keep the safe-area insets.** The nav pads with
`max(0.75rem, env(safe-area-inset-top))`, the footer and lightbox controls do the
equivalent at the bottom. Removing these puts controls under the notch or the
home indicator on iPhones. They depend on `viewportFit: "cover"` in the
`viewport` export in `layout.tsx`.

**6. Cap the content width.** `<main>` is `max-w-[1100px]`. Without it, line
length on a 4K monitor becomes unreadable.

---

## Proving it still works

`heron/scripts/audit-responsive.mjs` is written to be reusable and is the fastest
way to validate a new theme or a new site. It sweeps fifteen viewports from
280px to 3840px against both a touch and a mouse pointer profile, and fails on
horizontal overflow, undersized touch targets, unreadable text, or unreachable
navigation:

```bash
npm run dev
npm run audit:responsive          # or: node scripts/audit-responsive.mjs <baseUrl>
```

It currently reports 130 passing combinations with zero issues. Run it after any
theme change; it catches the whole class of "looks fine on my laptop" mistakes.

Then the usual gates:

```bash
npm run typecheck && npm run lint && npm test && npx playwright test
```

---

## Keeping the sites in sync afterwards

Under Option C there is nothing to sync — both sites build from the same commit,
and the only per-site state is the profile file, the `settings` rows, and the
SQLite database.

Two things to keep separate per site, and getting these wrong is the main risk:

- **Databases.** SQLite is a single file. Give each site its own
  `CMS_DB_PATH` (`/var/lib/heron-sam/data/cms.db`,
  `/var/lib/heron-brother/data/cms.db`) and its own backup and Litestream
  target. Never point two containers at one file.
- **S3 keys.** Uploads are written to `uploads/{id}-*`, and the id comes from
  each site's own database, so **two sites sharing one bucket prefix will
  overwrite each other's photos.** Either give each site its own bucket, or add
  a per-site prefix (`sites/{profileId}/uploads/...`) before the second site goes
  live. This is the single most important item in this document to get right,
  because the failure mode is silent data loss.

Shared safely between sites: the CloudFront distribution, the Lightsail
instance, the Caddy process, and the container image.
