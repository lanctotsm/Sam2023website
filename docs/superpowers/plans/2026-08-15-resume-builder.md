# Resume Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the resume builder per `docs/superpowers/specs/2026-08-15-resume-builder-design.md` — admin editor, SQLite persistence, public `/resume` rendering with JSON-LD, `resume.json` export, and a Typst-rendered PDF published to S3.

**Architecture:** A JSON Resume v1.0.0 document stored as a JSON blob in the `settings` table (key `resume`), sanitized by hand-written parsers per the `frontPage.ts` convention. Client admin page → `apiFetch` → `/api/resume` routes → `services/resume.ts` → Drizzle. PDF rendered on save by spawning the Typst binary (no shell), uploaded to S3 under a content-addressed key, URL recorded under settings key `resume_pdf`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Drizzle + better-sqlite3, Tailwind v4, Vitest (mocked DB), Typst CLI, existing `lib/s3.ts` helpers.

All paths below are relative to `heron/` unless prefixed with `infra/` or `.github/`.

---

### Task 1: Domain types and defaults

**Files:**
- Create: `lib/resume/types.ts` — the `ResumeDocument` types exactly as defined in the spec's Data model section.
- Create: `lib/resume/defaults.ts` — `STANDARD_SECTION_IDS = ["work","projects","skills","education","certificates"]`, `SECTION_LABELS`, and `createDefaultResume()` returning the empty skeleton (all `""` basics, empty arrays, `sectionOrder` pre-populated with the five standard ids, `meta.version = "v1.0.0"`).

- [ ] Write both files. No tests — pure data, covered through the parser tests.
- [ ] Commit: `feat(resume): add resume document types and empty default`

### Task 2: Sanitizing parser (TDD)

**Files:**
- Create: `lib/resume/parse.test.ts`
- Create: `lib/resume/parse.ts`

Exports: `sanitizeResumeDocument(raw: unknown): ResumeDocument` and
`parseResumeDocument(raw: string | null): ResumeDocument` (JSON.parse wrapper, never throws).
Helpers `str()`, `strArray()`, entry sanitizers, `generateId()` (crypto.randomUUID with fallback).
`sectionOrder` reconciliation: valid ids are the 5 standard ids plus custom section ids; unknown
dropped, missing appended (standard order first, then customs). `condensedWorkIds` /
`hiddenSections` filtered to resolvable ids. `hiddenSections` may not contain custom-only ids that
do not resolve.

- [ ] Write failing tests: null → default; malformed JSON → default; non-object → default; work entry missing id gets one; non-array `highlights` → `[]`; numbers/objects in string fields → `""`; unknown ids dropped from `sectionOrder` and missing standard ids appended; `condensedWorkIds` filtered; parse is idempotent (parse(JSON.stringify(parse(x))) deep-equals).
- [ ] Run `npm test -- lib/resume/parse.test.ts` — expect FAIL (module missing).
- [ ] Implement `parse.ts`.
- [ ] Run again — expect PASS.
- [ ] Commit: `feat(resume): add defensive resume document parser`

### Task 3: JSON Resume export shaping + JSON-LD (TDD)

**Files:**
- Create: `lib/resume/jsonResume.test.ts`, `lib/resume/jsonResume.ts`
- Create: `lib/resume/jsonLd.test.ts`, `lib/resume/jsonLd.ts`

`toJsonResume(doc, { canonical }): Record<string, unknown>` — deep-clones, drops empty-string and
empty-array optional fields (keeps `endDate: ""` on work entries — it is the "present" signal;
keeps entry `id`s so `meta.heron` references stay resolvable), stamps `meta.canonical`.
`toPersonJsonLd(doc, baseUrl)` — the mapping table from the spec; `worksFor` = work entry with
empty `endDate`; `telephone` omitted when phone blank; returns valid object for an empty document.

- [ ] Failing tests per the spec's Testing section; run; implement; run green.
- [ ] Commit: `feat(resume): add resume.json shaping and schema.org JSON-LD mapping`

### Task 4: Persistence service (TDD)

**Files:**
- Create: `services/resume.test.ts`, `services/resume.ts`

`getResume()` = `parseResumeDocument(await getSetting("resume"))`.
`saveResume(raw: unknown)` = sanitize → stamp `meta.lastModified` (ISO now) → `updateSetting`
→ return sanitized doc. Mock `@/services/settings` (not `getDb`) since the service composes the
settings service.

- [ ] Failing tests: absent row → default doc; save stamps lastModified and persists JSON; run; implement; green.
- [ ] Commit: `feat(resume): add resume persistence service over settings`

### Task 5: Typst PDF service (TDD)

**Files:**
- Create: `services/resumePdf.test.ts`, `services/resumePdf.ts`

`renderAndPublishResumePdf(doc): Promise<ResumePdfResult>` where
`ResumePdfResult = { status: "ok"; url: string; generatedAt: string } | { status: "failed" | "unavailable"; error: string }`.
Flow: `toJsonResume` → `execFile(TYPST_PATH ?? "typst", ["compile", "--input", "data="+json,
"--font-path", fonts, "--ignore-system-fonts", template, outTmp], { timeout: 15000, windowsHide: true })`
→ read tmp → `putObject({ key, contentType: "application/pdf" })` → `updateSetting("resume_pdf",
JSON.stringify({ url, generatedAt, sourceLastModified }))`. Key:
`resume/<slug(basics.name)||"resume">-<sha256(lastModified).slice(0,8)>.pdf`. URL from
`S3_PUBLIC_BASE_URL`. ENOENT → `unavailable`; non-zero exit → `failed` with stderr; never throws.
`getResumePdfInfo()` reads the `resume_pdf` setting.

- [ ] Failing tests per spec (no shell, `--ignore-system-fonts` present, key contains hash, stderr surfaced, ENOENT → unavailable, S3 skipped on failure); mock `node:child_process`, `@/lib/s3`, `@/services/settings`. Run; implement; green.
- [ ] Commit: `feat(resume): render resume PDF via typst and publish to S3`

### Task 6: API routes (TDD)

**Files:**
- Create: `app/api/resume/route.ts` (+ `route.test.ts`) — GET public returns doc; PUT auth-gated: save first, then render; returns `{ resume, pdf }`; failing render still 200 with `pdf.status: "failed"`.
- Create: `app/api/resume/export/route.ts` (+ test) — GET public; `Content-Disposition: attachment; filename="<slug>-resume.json"`; body = `toJsonResume`.
- Create: `app/api/resume/pdf/route.ts` (+ test) — GET public; 302 to recorded URL; 404 `errorResponse` when absent.
- Create: `app/api/resume/pdf/regenerate/route.ts` (+ test) — POST auth-gated; returns render result.

Mocks follow `app/api/posts/route.test.ts`: mock `@/lib/api-utils`, `@/services/resume`, `@/services/resumePdf`.

- [ ] Failing tests; run; implement; green.
- [ ] Commit: `feat(resume): add resume API routes (get/save, export, pdf)`

### Task 7: Public rendering

**Files:**
- Create: `components/resume/resumeSectionRegistry.tsx` — `{ id, label, View }` per standard section + custom-section View.
- Create: `components/resume/sections/{WorkSection,ProjectsSection,SkillsSection,EducationSection,CertificatesSection,CustomSection}.tsx` — View components (server-safe, no hooks).
- Create: `components/resume/ResumeView.tsx` — basics header + sections in `meta.heron.sectionOrder`, skipping hidden and empty; condensed work rendering; `isResumeEmpty()` helper.
- Rewrite: `app/resume/page.tsx` — server component; `getResume()`; empty → "Resume coming soon" card; `export const metadata`; embedded JSON-LD `<script type="application/ld+json">`; phone renders whenever non-blank.
- Modify: `app/globals.css` — `@media print` block per spec.

Styling: reuse `surface-card`, `heading-rule`, and the CSS-var text colors from the current resume page.

- [ ] Implement; verify with `npm run dev` + browser screenshot of `/resume` (empty state) and with seeded content.
- [ ] Commit: `feat(resume): render /resume from stored document with JSON-LD and print CSS`

### Task 8: Admin editor

**Files:**
- Create: `components/admin/BulletListEditor.tsx` — labeled string-array editor (add/remove/↑/↓), modeled on `ParagraphFieldsEditor`.
- Create: `components/admin/ResumeSectionOrderPanel.tsx` — reorder + show/hide, modeled on `HomePageSectionOrderPanel`.
- Create: `components/admin/ResumeEditor.tsx` — `"use client"`; loads GET `/resume`; Basics block (with phone spam warning helper text); section editors; entry add/remove/↑/↓; condensed checkbox per work entry; custom sections; header: Save, Export JSON (`/api/resume/export`), Download PDF (`/api/resume/pdf`), Regenerate PDF (POST), PDF status line; `sonner` toasts; class-string constants per admin convention.
- Create: `app/admin/resume/page.tsx` — renders `ResumeEditor`.
- Modify: `app/admin/layout.tsx` — add "Resume" nav link between Media Library and Users.

- [ ] Implement; manually exercise in dev: enter an entry, save, reload, reorder, hide a section, confirm `/resume` reflects it.
- [ ] Commit: `feat(resume): add admin resume editor`

### Task 9: Typst template + fonts + real render check

**Files:**
- Create: `resume-template/resume.typ` — full typographic system from the spec (bone page, ink/warm-gray/copper hairlines, Fraunces/Inter scale table, tnum dates column, unbreakable entries, headings bound to first entry, running header + page numbers from page 2, condensed entries, clickable un-styled links).
- Create: `resume-template/fonts/` — Fraunces + Inter TTFs (static instances if variable-font rendering proves unreliable in Typst; verify empirically with `typst fonts --font-path`).
- Create: `services/resumePdf.render.test.ts` — real-binary test: skips (`describe.skipIf`) when `typst` is absent; renders sample doc; asserts output starts with `%PDF-` and length > 10 KB.

- [ ] Download Typst binary locally (Windows) to a tools dir; download fonts; iterate: `typst compile --format png` and inspect the PNG until the layout matches the spec.
- [ ] Run the real-render test; green (or skipped in envs without typst).
- [ ] Commit: `feat(resume): add typst resume template and fonts`

### Task 10: Infrastructure

**Files:**
- Modify: `infra/lightsail-image/provision.sh` — install pinned Typst (linux-musl tarball → `/usr/local/bin/typst`).
- Modify: `.github/workflows/deploy-lightsail.yml` — include `resume-template/` in the deploy artifact next to the standalone server bundle.
- Modify: `heron/.env.local.example` — document `TYPST_PATH` (optional override) and note the PDF pipeline.
- Modify: root `README.md` — short "Resume builder" note: pinned Typst version, local install hint.

- [ ] Implement; validate workflow YAML parses (`gh workflow` requires push, so eyeball + yamllint-equivalent via PowerShell `ConvertFrom-Yaml` if available, else careful review).
- [ ] Commit: `chore(infra): provision typst and ship resume template in deploys`

### Task 11: Verification and PR

- [ ] Delete `docs/resume-mock.html` (spec: final step).
- [ ] `npm run lint` — 0 errors; `npm run typecheck` — clean; `npm test` — all green.
- [ ] Push branch `feat/resume-builder`; open PR with summary + test plan via `gh pr create`.

## Self-review notes

- Spec coverage: every spec section maps to a task (data model→1/2, exports→3/6, service→4, PDF→5/9/10, rendering→7, editor→8, print CSS→7, risks→9/10 mitigations, mock deletion→11).
- Type consistency: `ResumePdfResult` shape is shared by Tasks 5, 6, 8 (status line uses it).
- No UI unit tests: the repo has none (Vitest is node-env only); parity maintained, manual browser verification instead.
