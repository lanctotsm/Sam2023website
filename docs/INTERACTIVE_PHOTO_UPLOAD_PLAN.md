# Interactive Photo Upload Plan (eBay-Style)

A plan to make the album photo upload experience more engaging, with live previews, per-image interactions, and full delete semantics (album + database + S3).

---

## UX Insights from Site Exploration

Observations from navigating the live site that inform the design:

### Design System to Match

- **Palette**: Chestnut (primary), desert-tan, olive, caramel, copper for errors. Dark mode variants (`dark:border-dark-muted`, etc.).
- **Cards**: `rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]`
- **Inputs**: `rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5`
- **Buttons**: Primary `bg-chestnut text-desert-tan`; secondary `border border-chestnut bg-transparent text-chestnut`
- **Typography**: `text-chestnut` for headings, `text-olive` for secondary, `text-copper` for errors

### Navigation & Context

- **Upload** (`/upload`) is a standalone page under the main nav. Users must select an album from a dropdown *before* choosing files—no context of what the album already contains.
- **Admin** layout has horizontal nav: Posts, Albums, Media Library, Upload Photos. Album management is spread across Albums (create/link) and Order Images (reorder only).
- **Album detail** (`/albums/[slug]`) is read-only; empty state says "Upload a photo to get started" but provides no link, so users must find `/upload` manually.

### Upload Flow Pain Points

- **No preview before upload**: Only "X file(s) selected" text—no thumbnails until the entire batch completes.
- **Batch-only progress**: Single bar for all files; one failure blocks feedback on successful ones.
- **Immediate redirect**: After upload, user is sent to the album view. Cannot add more photos without returning to `/upload` and re-selecting the album.
- **Caption/alt apply to all**: No per-image editing; same metadata for every file in the batch.

### Link Image to Album (Admin Albums)

- Two dropdowns: Album + Image. Image options show caption or `s3_key`—no thumbnails, hard to identify images.
- Sort order is a separate number input. No visual feedback of which images are already in an album.

### Order Images Page

- Clean drag-to-reorder with `SortableImageGrid`; changes save automatically.
- Empty state: "No images in this album. Link images from the Albums page."—forces users to leave and use the dropdown flow.
- No way to add or remove images; only reorder.

### Recommendations for New Design

1. **Unified album editor**: One page per album (edit, upload, reorder, delete, rotate, crop) to match the consolidated Posts workflow.
2. **Stay in context**: Do not redirect after upload; keep user in the album editor and show new images in the grid.
3. **Visual consistency**: Reuse existing card, input, and button styles; match grid layout to album detail page (`grid-cols-[repeat(auto-fill,minmax(280px,1fr))]`).
4. **Actionable empty states**: Add "Add photos" / "Manage album" links on album detail for logged-in users, pointing to the album editor.
5. **Per-image thumbnails** in Link Image flow if retained—replace text dropdown with a thumbnail picker modal.

---

## Current State

### Upload Flow
- **`UploadForm.tsx`**: User selects files → clicks "Upload" → all files sent in one batch to `POST /api/images/upload`
- Images appear only after the entire batch completes
- No per-image preview, progress, or interaction during upload

### Delete Flow
- **`DELETE /api/images/[imageID]`** calls `deleteImage(id)` which only deletes from the **database**
- **S3 objects are NOT deleted** — orphan files remain in storage (cleanup script exists but is separate)
- `album_images` link is removed via DB `ON DELETE CASCADE` on `image_id`

### Storage
- Each image produces 3 S3 keys: `uploads/{uuid}/thumb.jpg`, `large.jpg`, `original.ext`
- Images are linked to albums via `album_images` (album_id, image_id, sort_order)

---

## Goals

1. **eBay-style UX**: Images appear in the album as they upload; each image is interactive
2. **Per-image actions**: Delete, rotate, crop
3. **Delete semantics**: When user deletes an image, remove from album, database, and S3
4. **Images still upload to DB/S3**; interactions apply to persisted images

---

## Phase 1: Fix Delete Semantics (Backend)

**Ensure `DELETE /api/images/[imageID]` removes S3 objects.**

1. Before calling `deleteImage(id)`, fetch the image row to get S3 keys (`s3_key`, `s3_key_thumb`, `s3_key_large`, `s3_key_original`)
2. Call `deleteObjects([...keys])` to remove from S3
3. Then call `deleteImage(id)` to remove from DB (album link goes via CASCADE)

**Files to change:**
- `heron/app/api/images/[imageID]/route.ts` — add S3 cleanup before DB delete
- Optionally: add a `deleteImageAndS3(id)` helper in `services/images.ts` or a dedicated service

---

## Phase 2: Single-Image Upload API

**Add an endpoint for uploading one image at a time** (for progressive uploads).

Options:

**A) New endpoint:** `POST /api/images/upload/single`
- Accepts: `FormData` with one `file`, optional `album_id`, `caption`, `alt_text`, `sort_order`
- Returns: `{ image: ImageMeta }`
- Allows the client to upload images one-by-one as they are selected/processed

**B) Keep existing `POST /api/images/upload`** but support single file
- Current route already handles multiple files; for one file it works as-is
- Client can call it per file (more requests but simpler)

**Recommendation:** Use existing `POST /api/images/upload` with one file per request for simplicity. No backend changes required beyond Phase 1.

---

## Phase 3: Interactive Upload UI

### 3.1 Architecture

**State model:**
```
pendingFiles: Array<{ id: string; file: File; preview?: string }>  // Selected but not yet uploaded
uploading: Array<{ id: string; file: File; progress: number }>      // In-flight
uploaded: Array<ImageMeta>                                           // Persisted, from API
```

**Flow:**
1. User selects/drops files → add to `pendingFiles`, generate `URL.createObjectURL` for preview
2. User can remove from `pendingFiles` before upload (no DB/S3 impact)
3. On "Upload" (or auto-start): move to `uploading`, send each file via `POST /api/images/upload`, track progress per request
4. As each completes: move to `uploaded`, show in album grid with actions

### 3.2 UI Components

| Component | Purpose |
|-----------|---------|
| `ImageUploadZone` | Dropzone + file picker; emits selected files |
| `PendingImageCard` | Thumbnail for file not yet uploaded; remove button, optional rotate (client-side only, before upload) |
| `UploadingImageCard` | Thumbnail + progress bar |
| `UploadedImageCard` | Thumbnail + overlay with Delete, Rotate, Crop actions |
| `ImageCropModal` | Modal for crop UI; outputs cropped blob |
| `ImageRotateButton` | Triggers rotate; can be client-side canvas or server re-process |

### 3.3 Layout (eBay-style)

Match existing site styling: use `cardClass`, `inputClass`, `labelClass`; grid `grid-cols-[repeat(auto-fill,minmax(200px,1fr))]` (or 280px for larger thumbnails like album detail).

```
┌─────────────────────────────────────────────────────────────────┐
│  Album: [Select album ▼]  (or in-context: album title/header)     │
├─────────────────────────────────────────────────────────────────┤
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  │  Drag and drop images here, or click to browse              │   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                                                                   │
│  Photos in this album:                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │
│  │ [img]│ │ [img]│ │ [img]│ │ [img]│ │  +   │  ← pending/uploaded │
│  │  ×   │ │  ↻   │ │  ✂️  │ │ 45%  │ │ add  │   (× = remove)     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

- **Pending**: Local preview (object URL), remove button; reuse card border/shadow.
- **Uploading**: Same card + progress bar (use `bg-chestnut` for bar, `bg-desert-tan-dark/30` for track as in current upload).
- **Uploaded**: Thumb from S3, hover overlay with Delete / Rotate / Crop; icon buttons styled like "Edit" / "Delete" on admin pages.

---

## Phase 4: Image Interactions

### 4.1 Delete

- **Action:** User clicks Delete on an uploaded image
- **Backend:** `DELETE /api/images/[imageID]` (after Phase 1, this removes album link, DB row, and S3 objects)
- **Frontend:** Remove from `uploaded` state, optionally show undo toast

### 4.2 Rotate

**Option A – Client-side (simpler):**
- Rotate on canvas → export as blob → `PUT /api/images/[imageID]/replace` with new file
- Server re-processes (thumb, large, original) and updates S3 + DB

**Option B – Server-side:**
- `PATCH /api/images/[imageID]` with `{ rotate: 90 | 180 | 270 }`
- Server fetches from S3, rotates with sharp, overwrites S3 keys, updates dimensions in DB

**Recommendation:** Option B for rotate (no re-upload of bytes). Add `rotate` to image-processing and a new API handler.

### 4.3 Crop

**Flow:**
- User clicks Crop → open modal with crop overlay (e.g. `react-image-crop` or custom canvas)
- User draws crop region → export cropped blob
- Upload cropped image: either `PUT /api/images/[imageID]/replace` or new `PATCH /api/images/[imageID]/crop`
- Server receives new image buffer, runs `processImage`, overwrites S3, updates DB

**New endpoint:** `PUT /api/images/[imageID]/replace`  
- Accepts `FormData` with `file`
- Validates file, runs `processImage`, updates S3 (delete old keys, put new), updates `images` row

---

## Phase 5: API Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/images/upload` | Upload one or more images; `album_id` in formData links to album |
| GET | `/api/images/[imageID]` | Fetch image metadata |
| DELETE | `/api/images/[imageID]` | Delete image from album, DB, and S3 (Phase 1) |
| PUT | `/api/images/[imageID]` | Update metadata (caption, alt_text) — existing |
| PUT | `/api/images/[imageID]/replace` | Replace image file (for crop/rotate re-upload) — new |
| PATCH | `/api/images/[imageID]/rotate` | Rotate by 90° (optional; can use replace instead) |

---

## Phase 6: Implementation Order

1. **Phase 1** — Fix DELETE to remove S3 objects (required for correct delete behavior)
2. **Phase 3.1–3.2** — Refactor `UploadForm` to per-image upload and show images in album as they complete
3. **Phase 4.1** — Wire Delete button to existing DELETE API (now with S3 cleanup)
4. **Phase 4.2** — Add Rotate (either PATCH rotate or PUT replace)
5. **Phase 4.3** — Add Crop (PUT replace + crop modal)
6. **Phase 3.3** — Polish layout and UX

---

## Dependencies

- **Frontend:** Consider `react-image-crop` or similar for crop UI; or use native Canvas API
- **Backend:** `sharp` already used for `processImage`; can add rotate/transform
- No new storage or DB schema changes

---

## Out of Scope (for later)

- Reorder images via drag-and-drop (could use existing `PUT /api/albums/[albumID]/images` with `order`)
- Batch rotate/crop
- Undo delete (soft delete + restore)
