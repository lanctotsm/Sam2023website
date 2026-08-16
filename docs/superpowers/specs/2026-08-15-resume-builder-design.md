# Resume Builder — Design

Date: 2026-08-15
Status: Approved, ready for implementation planning

## Problem

`heron/app/resume/page.tsx` is hardcoded JSX. Every content change requires a code edit and a
deploy, the data cannot be exported anywhere, and there is no way to produce a PDF. The page is
also the most likely page on the site to be shared directly, so it needs to be easy to keep current.

## Goals

- Edit resume content through the admin UI, persisted to SQLite.
- Serve `/resume` from that stored data — one source of truth.
- Export a standards-compliant `resume.json` ([JSON Resume](https://jsonresume.org) v1.0.0).
- Produce a PDF.
- Emit Schema.org `Person` JSON-LD on `/resume` for search engines and crawlers.
- Support content that the JSON Resume standard does not model, without breaking the standard export.

### Derived outputs and their audiences

Beyond the rendered page itself, the document drives three derived outputs. Being explicit about
who each one serves, because it determines what each optimizes for.

| Output | Audience | Optimizes for |
|---|---|---|
| `resume.json` | Sam, later | **Portability.** Lifting the data into a future site or tool. Completeness matters more than elegance — nothing entered should be unrecoverable from the file |
| JSON-LD on `/resume` | Search engines, AI crawlers | **Discovery.** Crawlers read the HTML page, not a JSON file they have no reason to request |
| PDF | Humans | **Craft.** A deliberately typeset document, not a printout of the web page |

The export is explicitly *not* a recruiter-facing interface. Nothing external will fetch it, and it
should not be designed as though something will.

## Non-goals

- Multiple resume variants or per-application tailoring. One canonical resume.
- Importing an existing `resume.json`. Export only.
- Server-side PDF rendering. See the PDF decision below.
- Any change to the existing homepage section builder.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Canonical format | JSON Resume v1.0.0 | Makes `resume.json` export near-passthrough; gives access to third-party themes and validators |
| Extension mechanism | `meta.heron` namespace | The spec leaves `meta` open for tool data, so the export stays strictly valid while nothing entered is lost |
| Storage | JSON blob in `settings`, key `resume` | The canonical form is already a document; follows the existing `front_page` pattern; no migration, no new tables |
| PDF | Typst binary, rendered on save, served from S3/CloudFront | Real typesetting engine, and permanently decoupled from React/Next/Node so a future upgrade cannot break it |
| Reordering | Up/down buttons | Matches `HomePageSectionOrderPanel`; keyboard accessible; no new dependency |
| Validation | Hand-written `sanitize*` functions | The codebase has no Zod; `parseFrontPageConfig` is the established pattern |

### Rejected alternatives

**Normalized tables** (`resume_work`, `resume_highlights`, …with `sort_order`). Roughly seven tables
and a migration to model one document that holds one row's worth of content. Every read would join
and reassemble into the nested JSON Resume shape anyway; every reorder becomes N updates.

**`@react-pdf/renderer`.** Pure JS, no system dependency, and it would run on the nano. Rejected on
coupling: its reconciler reads React internals the react-server layer does not expose, so it is
already incompatible with React 19 and would break at the next framework upgrade. Tying the resume
PDF to the app's React version is a standing liability for something that has no reason to care.
Its typography is also weaker — flexbox over a drawing API, with no variable-font support, so
Fraunces would have required static instances.

**Browser print (`window.print()` on a `/resume/print` route).** Zero dependencies and zero server
cost. Rejected because the browser's print engine caps how good the output can be: margins and
page-break handling differ across browsers, headers and footers are user-controlled, and fine
typographic control — tracking, tabular figures, exact hairline weights — is not reliably available.
The goal is a document that looks deliberately typeset, and print CSS cannot get there.

Basic `@media print` styling is still added to `/resume` as general hygiene, so Ctrl+P on the page
produces something reasonable. It is simply not the PDF pipeline.

**Headless Chrome (Puppeteer/Playwright).** Would give perfect HTML fidelity. Rejected on memory:
Chromium wants 200–400 MB alongside Next.js, SQLite, and sharp on a 512 MB instance, and the runtime
image installs no browser or its system dependencies.

**`pdfkit`.** Lightest dependency, but requires manual positioning and pagination. Too fiddly for
variable-length bullet content.

**Freeform section types** like the homepage builder. Rejected because arbitrary sections make the
`resume.json` export lossy. Custom sections are supported through `meta.heron.customSections`
instead, which quarantines them from the standard fields.

## Data model

A single `settings` row, key `resume`, whose value is a JSON-serialized `ResumeDocument`.

```ts
// lib/resume/types.ts

export type ResumeDocument = {
  basics: Basics;
  work: WorkEntry[];
  projects: ProjectEntry[];
  skills: SkillGroup[];
  education: EducationEntry[];
  certificates: CertificateEntry[];
  meta: ResumeMeta;
};

export type Basics = {
  name: string;
  label: string;              // e.g. "Senior Software Engineer"
  email: string;
  phone: string;              // blank omits it everywhere; see the note below
  url: string;
  summary: string;            // intro paragraph
  location: { city: string; region: string };
  profiles: Profile[];
};

export type Profile = {
  id: string;
  network: string;            // "LinkedIn", "GitHub"
  username: string;
  url: string;
};

export type WorkEntry = {
  id: string;
  name: string;               // company
  position: string;
  location: string;
  url: string;
  startDate: string;          // ISO8601 partial, "2019-08"
  endDate: string;            // "" means present
  summary: string;            // the one-line role description
  highlights: string[];       // bullets
};

export type ProjectEntry = {
  id: string;
  name: string;
  description: string;
  highlights: string[];
  keywords: string[];         // rendered as the tech line
  url: string;
  startDate: string;
  endDate: string;
};

export type SkillGroup = {
  id: string;
  name: string;               // "Primary", "Cloud & platforms"
  keywords: string[];
};

export type EducationEntry = {
  id: string;
  institution: string;
  area: string;               // "Computer Engineering"
  studyType: string;          // "B.S."
  startDate: string;
  endDate: string;
  url: string;
};

export type CertificateEntry = {
  id: string;
  name: string;
  date: string;
  issuer: string;
  url: string;
};

export type CustomSectionEntry = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  bullets: string[];
};

export type CustomSection = {
  id: string;
  heading: string;
  entries: CustomSectionEntry[];
};

export type ResumeMeta = {
  canonical: string;
  version: string;            // "v1.0.0"
  lastModified: string;       // ISO8601 timestamp, set on save
  heron: {
    sectionOrder: string[];   // section ids, standard and custom interleaved
    hiddenSections: string[]; // section ids excluded from public/PDF/JSON-LD render; entries stay in the document
    condensedWorkIds: string[];
    customSections: CustomSection[];
  };
};
```

### Section identifiers

The five standard sections use fixed ids: `work`, `projects`, `skills`, `education`,
`certificates`. Custom sections use generated UUIDs. `sectionOrder` contains both, which is what
lets a custom section sit between two standard ones.

### Two modelling notes

**The condensed "Earlier" treatment is a per-entry flag, not a section.** Older roles are ordinary
`work` entries whose ids appear in `meta.heron.condensedWorkIds`; they render compactly (one line
plus a sentence, no bullets). A third-party JSON Resume consumer therefore sees a normal, complete
work history.

**`basics.phone` is an ordinary field with no special gating.** If it is filled in it renders
everywhere — public page, PDF, and JSON export; if it is blank it renders nowhere. The empty
field is the off switch, so there is no separate visibility toggle and no hidden state.

Publishing a phone number on a page that gets scraped invites spam calls, so the admin editor
carries an inline warning next to the field. That is an informed-consent problem, not an access
control problem: nobody but Sam logs into this site, so an auth gate would add machinery that
protects nothing.

## Architecture

```
lib/resume/types.ts                          type definitions above
lib/resume/defaults.ts                       createDefaultResume() — empty placeholder
lib/resume/parse.ts                          parseResumeDocument() + sanitize* helpers
lib/resume/jsonResume.ts                     toJsonResume() — export shaping
lib/resume/jsonLd.ts                         toPersonJsonLd() — Schema.org mapping
services/resumePdf.ts                        spawn Typst, upload to S3, record URL
app/api/resume/pdf/route.ts                  GET — 302 to current object, 404 if missing or stale
app/api/resume/pdf/regenerate/route.ts       POST — re-render without editing content
resume-template/resume.typ                   the Typst document
resume-template/fonts/*.ttf                  Fraunces and Inter
services/resume.ts                           getResume() / saveResume()
app/api/resume/route.ts                      GET (public), PUT (auth)
app/api/resume/export/route.ts               GET resume.json as a download
app/admin/resume/page.tsx                    admin editor route
app/resume/page.tsx                          rewritten: read setting, render ResumeView
components/resume/ResumeView.tsx             the single renderer
components/resume/resumeSectionRegistry.tsx  section id -> { View, Editor, label }
components/resume/sections/*.tsx             View + Editor pair per section type
components/admin/ResumeEditor.tsx            top-level editor shell
components/admin/ResumeSectionOrderPanel.tsx show/hide + reorder
components/admin/BulletListEditor.tsx        reusable string-array editor
```

`app/admin/layout.tsx` gains a "Resume" nav link alongside the existing admin links.

Layering follows the existing convention: client page → `apiFetch` → route handler (auth +
sanitize) → service → Drizzle.

A dedicated `/api/resume` is used rather than extending `/api/settings`, because the settings route
applies an `ALLOWED_SETTING_KEYS` allowlist and treats values as opaque strings, whereas this
payload needs structural sanitizing before it is written.

### Data flow

Read path: `getResume()` reads `settings.resume`, runs `parseResumeDocument`, returns a valid
`ResumeDocument`. Used by the public page, the print page, the export route, and the admin GET.

Write path: admin holds the whole document in React state and `PUT`s it. The route authenticates
via `getAuthUser()`, sanitizes, stamps `meta.lastModified`, and calls `saveResume()`, which upserts
the `settings` row through the existing settings service.

## Editor UX

Modelled on the homepage section builder.

A **Basics** block sits at the top, outside the reorderable list — name, label, email, phone, URL,
location, the summary paragraph, and the profile links. It is not part of `sectionOrder` and cannot
be hidden or moved, because a resume without a name at the top is not a resume.

The phone input carries an inline warning directly beneath it: leaving it blank omits it everywhere,
and filling it in publishes it on a public page where scrapers can harvest it, which tends to
attract spam calls. The warning uses the same muted helper-text treatment as other admin hints
rather than an alarming red banner — it is a note, not an error.

Below Basics, a section order panel lists every remaining section with up/down buttons and a
visibility toggle, mirroring `HomePageSectionOrderPanel`. Hide is a render flag, not a delete:
the section's entries stay in the stored document so showing it later restores the same content.
Hidden sections remain fully editable in the admin editor; `hiddenSections` is consulted only by
the public page, JSON-LD, PDF, and print.

Within a section, entries can be added, removed, and reordered with the same up/down control. Each
work entry exposes its fields plus a `BulletListEditor` for highlights and a "condensed" checkbox.
Skills groups are a name plus a keyword list. Custom sections are a heading plus entries.

A single Save button `PUT`s the document; `sonner` toasts report success and failure. Styling reuses
the existing `inputClass` / `labelClass` / `cardClass` / `btnAdd` / `btnDanger` string constants.

The editor header carries, alongside Save: an "Export JSON" link, a "Download PDF" link to
`/api/resume/pdf`, and a "Regenerate PDF" button. A status line shows when the current PDF was
generated, or surfaces the Typst error when the last render failed.

## Rendering

`ResumeView` accepts a `ResumeDocument` and renders the web page, skipping any id in
`meta.heron.hiddenSections` and any section with zero entries. `/resume` wraps it in
`PageStyleProvider`, preserving today's theming, and adds page-specific `metadata` (title,
description, OG) which the current page lacks.

The PDF is rendered by a separate component tree (see the PDF section). This duplication is
deliberate: the PDF is not a printout of the web page, it is a differently and more tightly typeset
document. The shared thing is the data, not the layout.

### Structured data

`/resume` embeds a `<script type="application/ld+json">` produced by `toPersonJsonLd()`. This is the
output that crawlers actually consume — they read the page, not `resume.json`. `JSON.stringify`
output has `<` escaped to `\u003c` before it is assigned to `dangerouslySetInnerHTML`, so an
admin-authored field cannot break out of the script element.

Sections listed in `meta.heron.hiddenSections` are omitted from this mapping the same way they are
omitted from the visible page, so hiding a section also hides it from crawlers. The stored document
is unchanged.

The mapping from `ResumeDocument` to Schema.org `Person`:

| Resume field | Schema.org |
|---|---|
| `basics.name` | `name` |
| `basics.label` | `jobTitle` |
| `basics.summary` | `description` |
| `basics.email` | `email` (as `mailto:`) |
| `basics.phone` | `telephone`, omitted when blank |
| `basics.url` | `url` |
| `basics.location` | `address` as `PostalAddress` |
| `basics.profiles[].url` | `sameAs[]` |
| the `work` entry with an empty `endDate` | `worksFor` as `Organization` |
| `education[]` | `alumniOf[]` as `EducationalOrganization` |
| `skills[].keywords` flattened | `knowsAbout[]` |
| `certificates[]` | `hasCredential[]` as `EducationalOccupationalCredential` |

### Print CSS

Independently of the PDF pipeline, `globals.css` gains an `@media print` block: page margins, site
chrome hidden, backgrounds and shadows removed, `break-inside: avoid` on entries, and link hrefs
surfaced. The codebase currently has no print styles at all, so this is general hygiene for anyone
who hits Ctrl+P. It is not how the PDF is produced.

### Empty states

Sections with zero entries are skipped entirely by the renderer. If the whole document is empty —
the state immediately after first deploy — `/resume` renders a minimal "Resume coming soon"
placeholder rather than a page of empty headings. The admin editor always shows all sections with
their empty states and "+ Add" buttons regardless.

## Exports

**JSON.** `GET /api/resume/export` passes the stored document through `toJsonResume()` and returns
it with `Content-Disposition: attachment; filename="samuel-lanctot-resume.json"`, following the
`feed.xml` precedent for non-HTML responses.

`toJsonResume()` drops empty optional fields so the output is clean rather than littered with `""`.
That includes a blank `endDate`: JSON Resume v1.0.0 `format: date` rejects `""`, and a missing
`endDate` is the schema's "present" signal. The stored document still uses `endDate: ""`
internally. `meta.lastModified` and `meta.canonical` are stamped. `meta.heron` is retained,
including `hiddenSections`, so the export is a faithful round trip — hidden section *entries* stay
in the file; only public renderers consult the flag.

An empty name falls back to the filename `resume.json` (not `resume-resume.json`).

The route is public and unauthenticated, so the file can be linked directly from the resume page.

**PDF.** `GET /api/resume/pdf` returns a server-rendered PDF as an attachment. See the PDF section
below.

## PDF

The PDF is the artifact a human holds, and it should look deliberately typeset rather than printed
off a website. It is produced by a real typesetting engine, entirely outside the JavaScript runtime.

### Engine: Typst

[Typst](https://typst.dev) is a Rust typesetting engine — a modern LaTeX replacement — distributed
as a standalone binary. The application's entire interface to it is a subprocess invocation with a
JSON string.

Two reasons it is the right tool rather than a JavaScript PDF library:

**It is permanently decoupled from the application stack.** Nothing about the pipeline depends on
React, Next, or Node versions. A future React 19 or Next upgrade cannot break the resume PDF, which
is not true of any React-based renderer. If the site were rewritten in another language entirely,
the PDF pipeline would be untouched.

**The typography is materially better.** JavaScript PDF libraries approximate a document with
flexbox on top of a drawing API. Typst does paragraph-level line breaking, hyphenation, kerning,
ligatures, and full OpenType feature selection — which is what the brief actually requires. It also
emits tagged PDFs by default for accessibility, and supports variable fonts, so Fraunces can be used
as-is rather than needing static instances.

### Invocation

```
typst compile \
  --input data=<json> \
  --font-path <template>/fonts \
  --ignore-system-fonts \
  <template>/resume.typ <output>.pdf
```

Inside the template, `#let data = json(bytes(sys.inputs.data))` parses the payload and the document
is built from it. The data passed is the output of `toJsonResume()` — the same document served by
the JSON export, so the PDF and the export can never describe different resumes.

Requirements on the call:

- Spawned with `execFile`, **never with a shell**. The payload contains user-authored content;
  shell interpolation would be a command-injection vector. Passing `--input data=<json>` as a
  single argv element avoids all escaping concerns. Resume JSON is a few KB, far below `ARG_MAX`.
- A hard timeout (15s) and captured `stderr`, which carries Typst's diagnostics and is the only
  useful signal when a template fails.
- `--ignore-system-fonts` so output is byte-identical between a Windows dev machine and the Ubuntu
  host. Without it, Typst silently substitutes system fonts and local output diverges from
  production.

### Template and fonts

The template lives at `heron/resume-template/`, outside `app/` — it is not part of the Next build.

- `resume.typ` — the document
- `fonts/` — Fraunces and Inter, committed to the repo

**Deployment gotcha:** Next's standalone output will not include `resume-template/` automatically.
The deploy workflow must copy it alongside the server bundle, or the binary will run and fail to
find its template in production while working perfectly in dev.

### When rendering happens

On save, not on request. `PUT /api/resume` persists the document, then renders and uploads the PDF
to S3 under a key containing a short hash of the **rendered PDF bytes**. CloudFront serves it from
there. Hashing the artifact (not `lastModified`) means a template- or font-only regenerate also
gets a new immutable key instead of overwriting a cached object.

This means the instance renders a handful of times ever, never serves PDF bytes, and has no
per-request memory exposure — which is a better outcome than the caching scheme a request-path
renderer would have needed.

- **Save never fails because of the PDF.** The document is persisted first. The render result is
  reported separately in the response as `pdf: { status, url, error }`, and the admin surfaces it
  as its own toast. A failed render does **not** update `resume_pdf`.
- **Content-addressed keys mean no CloudFront invalidation.** A new PDF body produces a new key, so
  the CDN never serves a stale file.
- The resulting URL is recorded under a separate settings key, `resume_pdf`, holding
  `{ url, generatedAt, sourceLastModified }`. It is deliberately *not* stored inside the resume
  document, which stays a pure JSON Resume artifact.
- **Graceful degradation.** If the binary is absent — a fresh Windows dev machine — the save still
  succeeds and the status reports the PDF as unavailable. Nothing crashes.
- A **Regenerate PDF** button in the admin editor re-runs the render without editing content, for
  recovering from a failure or picking up a template change.
- **Invalid dates do not crash Typst.** `fmt-partial` only formats exact `YYYY` or `YYYY-MM` with
  month 01–12; anything else (including `"Present"` typed into a start date) is passed through.

`GET /api/resume/pdf` is a stable public URL that 302-redirects to the current CloudFront object
when `resume_pdf.sourceLastModified` matches the stored document's `meta.lastModified`. It returns
404 with a clear message when no PDF has been generated yet, **or** when those timestamps differ —
so a successful save whose render then failed cannot keep serving the previous resume as a PDF.

### Typographic system

The brief is restraint and obsessive detail: warm paper, quiet ink, generous margins, and hierarchy
carried by size and letterspacing rather than by weight and color.

**Page.** US Letter. Margins 0.85in left and right, 0.72in top, 0.6in bottom. A full-bleed
background rectangle in bone `#FBF7F0` — warm off-white, never pure white, since white is what
makes a PDF read as "printed from a browser."

**Ink.** Primary `#2A0502` (chestnut-dark, near-black but warm). Secondary `#6B5B4A` (warm gray) for
dates, role summaries, and contact details. Copper `#B64B12` appears only in hairline rules — never
in text. Restraint is the whole point; two inks and an accent.

**Scale.**

**Faces.** Fraunces for display, Inter for text. A high-contrast serif over a neutral grotesque is
the classic editorial pairing: Fraunces carries the identity and does all the talking, Inter stays
quiet and is exceptional at 9pt. Both are committed to `resume-template/fonts/`.

| Element | Face | Size | Treatment |
|---|---|---|---|
| Name | Fraunces 600 | 26pt | tracking −0.01em |
| Job title under name | Inter 400 | 10pt | uppercase, tracking 0.08em, warm gray |
| Contact line | Inter 400 | 8.5pt | warm gray, hairline separators |
| Section heading | Inter 600 | 8pt | uppercase, tracking 0.14em, 0.5pt rule beneath in `#E0D5C2` |
| Role title | Fraunces 600 | 11.5pt | |
| Company | Inter 600 | 10pt | |
| Dates | Inter 400 | 9pt | tabular figures (`tnum`), right-aligned in a fixed column |
| Role summary | Inter 400 italic | 9pt | warm gray |
| Bullets | Inter 400 | 9.5pt / 13.5pt leading | 2pt square marker, 10pt hanging indent |

Tabular figures on the dates matter more than they sound — they are what make the right-hand date
column align exactly rather than almost. Typst exposes OpenType features directly, so this is a
setting rather than a workaround. Section headings use weight 600 rather than 700; at 8pt with
0.14em tracking, 600 already reads emphatic, and it keeps the embedded font set to four faces.

**Rhythm.** 4pt between bullets, 12pt between entries, 18pt between sections. Consistent throughout;
no ad-hoc spacing.

**Page breaks.** Entries are wrapped in blocks marked unbreakable so a job never splits across
pages, and section headings are bound to the entry following them so a heading cannot strand itself
at the foot of a page. Pages after the first carry a running header — name in small caps, 7pt, warm
gray — and a footer with page numbers.

**Links** are embedded and clickable but styled as plain ink: no blue, no underline.

**Condensed entries** collapse to a single line of title, company, and dates, plus one sentence at
9pt, with no bullets — the "Earlier" treatment from the mock.

## Validation

`lib/resume/parse.ts` mirrors `parseFrontPageConfig`'s defensive contract: never throw, always
return a structurally valid `ResumeDocument`.

- Unparseable or absent JSON returns `createDefaultResume()`.
- Every string field is coerced and trimmed; missing fields become `""`.
- Array fields that are not arrays become `[]`.
- Entries missing an `id` get a generated one.
- `sectionOrder` is reconciled against the sections that actually exist: unknown ids are dropped,
  missing ids are appended in default order.
- `condensedWorkIds` and `hiddenSections` are filtered to ids that resolve.

## Testing

Vitest, mocking the DB, per the existing convention.

- `lib/resume/parse.test.ts` — malformed JSON, null, wrong types, missing ids, `sectionOrder`
  reconciliation in both directions, idempotency of parse.
- `lib/resume/jsonResume.test.ts` — an exported document conforms to the JSON Resume v1.0.0 shape;
  empty optional fields are dropped, including `basics.phone` when blank and `endDate: ""` (present
  = omitted); `meta.heron` survives a round trip; hidden section entries remain in the export.
- `lib/resume/jsonLd.test.ts` — `@context` and `@type` are correct; `worksFor` resolves to the
  entry with an empty `endDate`; `telephone` is absent when the phone is blank; hidden sections are
  omitted from the mapping; an empty document produces valid JSON-LD rather than throwing.
- `services/resume.test.ts` — `getResume` on an absent row returns the default; `saveResume`
  upserts; mocked `getDb` following `services/settings.test.ts`.
- `app/api/resume/route.test.ts` — unauthenticated `PUT` returns 401; authenticated `PUT`
  sanitizes; `GET` returns 200.
- `app/api/resume/export/route.test.ts` — `Content-Disposition` header present and correct; body
  parses as JSON.
- `services/resumePdf.test.ts` — with `execFile` mocked: the binary is invoked **without a shell**,
  `--ignore-system-fonts` is present, the S3 key contains a hash of the PDF bytes, a non-zero exit
  surfaces `stderr` as the error, and a missing binary degrades to "unavailable" rather than
  throwing.
- `app/api/resume/pdf/route.test.ts` — 302 to the recorded URL when `sourceLastModified` matches;
  404 when no PDF has been generated; 404 when the recorded PDF is stale relative to the document.
- `app/api/resume/route.test.ts` also asserts that a **failing render still returns a successful
  save** with `pdf.status: "failed"`. That invariant is the whole reason the render is decoupled
  from persistence, so it deserves an explicit test.

One non-mocked check earns its keep: a test that shells out to the real Typst binary with the real
template and fonts, asserting the output starts with `%PDF-` and clears a plausible byte floor. It
skips itself when the binary is absent, so Windows dev machines and CI without Typst stay green.
This is what catches a broken template or a missing font file — the most likely production failure,
and the one thing mocks structurally cannot see.

## Placeholder content

`createDefaultResume()` returns an empty skeleton — no seeded content. Sam will enter the real
resume through the admin UI.

The skeleton has empty strings for all `basics` fields, empty arrays for all five standard section
collections, and `meta.heron.sectionOrder` pre-populated with
`["work", "projects", "skills", "education", "certificates"]` so the editor presents all sections
with empty states from the start. No changes to `scripts/seed.ts` are needed; `getResume()` returns
the default when the settings row is absent.

## Risks

**Typst must be installed in the runtime image.** This is the real cost of the approach.
`infra/lightsail-image/provision.sh` installs a pinned Typst version, and the runtime image must be
rebuilt via `build-lightsail-runtime.yml` before the first deploy that depends on it. Deploying the
app ahead of the image produces a working site with a permanently failing PDF.

**The template must reach production.** Next's standalone output will not include
`resume-template/`. If the deploy workflow does not copy it, the feature works in dev and fails in
production — the worst failure mode there is. Called out in the deployment step of the plan.

**Local dev on Windows needs Typst.** Mitigated by graceful degradation: a missing binary reports
the PDF as unavailable rather than breaking saves, and the real-render test skips itself.

**Version drift between dev and production.** Different Typst versions can lay out identically-
authored documents slightly differently. Mitigated by pinning the same version in `provision.sh`
and documenting it in the README, and by `--ignore-system-fonts` so font resolution cannot vary by
host.

**Whole-document saves can clobber concurrent edits.** With one admin this is not a practical
concern, and the homepage editor already has the same property.

**`docs/resume-mock.html` becomes stale** once the real page exists. It should be deleted as the
final implementation step.

## Follow-on work, explicitly out of scope

- Importing an existing `resume.json`.
- Resume variants for per-application tailoring.
- Running the print output through `@resume/ats-validator` (new in the JSON Resume monorepo) to
  check applicant-tracking-system compatibility.
- Emitting Open Talent Protocol or `cv.json`. Both are young and single-vendor-backed, and both are
  supersets of or field-compatible with JSON Resume, so either can be generated later from the same
  document if one gains real adoption.
