# Add RAW / PSD / HEIC thumbnail support

## Context

PICR currently generates thumbnails with **sharp** (libvips). Sharp's prebuilt binary
natively handles JPEG/PNG/GIF/WebP/TIFF/SVG but has **no RAW and no PSD/PSB decoder**,
and its HEIC support is unreliable (patent-gated in prebuilts). Photographers routinely
share Canon/Nikon/Sony/Fuji RAW files, layered PSD/PSB, and iPhone HEIC — today those
land as `FileType.File` (stored, no thumbnail, 404 on `/image`).

Goal: make RAW, PSD/PSB, and HEIC/HEIF appear as normal gallery images with working
thumbnails, downloads, blurhash and lightbox, while changing the sharp pipeline as
little as possible.

**Decisions made with the user:**

- **Strategy:** extract the **embedded JPEG preview** for RAW (fast, low-memory, matches
  what Lightroom shows). No full demosaic decode.
- **Formats:** RAW (all major brands) + PSD/PSB + HEIC/HEIF.
- **Tools:** **exiftool** (RAW preview extraction) + **ImageMagick** (`magick`, for
  PSD/PSB composite and HEIC), added to the Docker image alongside ffmpeg.
- **Reclassification of existing 1.0 files:** `typeChanged` gate only — **no bulk
  migration** (self-heals on boot scan; respects the capability probe; keeps transient
  failures non-sticky).

**Review-driven design constraints (all incorporated):**

1. Lightbox display-vs-download is a **required** change (original is browser-un-displayable).
2. Decode failure must **never blackhole a file**, and must **not be permanently sticky**.
3. External tool execution is **async with a timeout** (no `spawnSync` on the request path).
4. PSD/PSB composite extraction is **best-effort** (fixture tests for layered/PSB/no-composite).
5. HEIC/PSD support is **capability-probed at boot**; unsupported formats stay `FileType.File`.
6. Decoded intermediates are **validated with sharp** before being trusted as cache.

## Core design: "decode to an intermediate, then reuse the sharp pipeline"

Mirror the existing external-tool pattern used for video (ffmpeg): shell out to a CLI to
produce a sharp-openable intermediate JPEG, then feed it to the **unchanged** sharp
resize/encode/metadata/blurhash code. A single choke point resolves the source path:

- **Sharp-readable formats** (`.jpg .png .gif .webp .tiff .tif .svg`) → original path
  unchanged (zero behavior change).
- **RAW / PSD / HEIC** → a cached decoded JPEG, generated on first use.

### Shared format lists: `shared/imageFormats.ts` (NEW)

The extension→category knowledge must be shared so the **frontend lightbox** can decide
display-vs-download without a schema change. Two **separate** lists (they are not the same
set — TIFF is sharp-readable but not browser-displayable):

- `sharpReadableExtensions`: `.jpg .jpeg .png .gif .webp .tiff .tif .svg` (libvips reads
  the original directly).
- `browserDisplayableOriginalExtensions`: `.jpg .jpeg .png .gif .webp .svg` (safe to hand
  the original to an `<img>` — **excludes TIFF**).
- `rawExtensions`: `.cr2 .cr3 .nef .nrw .arw .sr2 .srf .dng .raf .orf .rw2 .pef .srw .x3f .3fr .erf .kdc .dcr .mrw .raw` (extend as needed).
- `magickDecodeExtensions`: `.psd .psb .heic .heif`.
- Helpers: `isBrowserDisplayableOriginal(name)`, `isDecodableImageFormat(name)`. **Match the
  extension case-insensitively** (`extname(name).toLowerCase()`, as `addFile.validExtension`
  already does) — camera RAW files are frequently uppercase (`.CR2`, `.NEF`, `.ARW`).

Backend keeps **tool selection** (`decoderFor`, capability-dependent) separate; it imports
the raw/magick lists from `shared/imageFormats`.

### New module: `backend/media/ensureDecodedImage.ts` (async, timeout, validated, dedup)

```ts
// Returns a path sharp can open. Original for sharp-readable formats; a cached, VALIDATED
// intermediate JPEG for RAW/PSD/HEIC (generated on demand, cached by hash). Async — never
// blocks the event loop. Throws on decode/validation failure (callers handle fallback).
export const ensureDecodedImage = async (file: FileFields): Promise<string>
```

Behavior:

1. `decoderFor(file)` → `'none' | 'exiftool' | 'magick'` (consults runtime `mediaCaps`).
2. `'none'` → return `fullPathForFile(file)`.
3. Else compute `decodedImagePath(file)`; if it exists, return it (idempotent). Cache is
   **trusted by existence**, consistent with how generated thumbnails are trusted
   (`generateAllThumbs` existsSync). Because new cache files are sharp-validated _before_
   `rename` (step 6), the only way a bad cache file exists is manual tampering or an old
   buggy build; accepted as cache hygiene (a `fileHash`/version bump invalidates it).
   Optional hardening: `sharp().metadata()`-validate an existing hit once before returning.
4. **Dedup** concurrent work with an in-flight promise map keyed `file.id`, mirroring
   `videoThumbnailQueue` in `media/generateVideoThumbnail.ts`.
5. Decode **asynchronously** to a `*.tmp` candidate (async `spawn`/`execFile`, `{ timeout }`
   ~30s). **All external calls use argument arrays, never a shell string**, so filenames
   with spaces/brackets are safe:
   - **exiftool (RAW):** try tags in priority order — `-b -JpgFromRaw`, then
     `-b -PreviewImage`, then `-b -ThumbnailImage`. **Each tag writes to its own fresh temp
     candidate** (truncate/delete before the next attempt), so a failed later tag can never
     validate stale bytes from an earlier one. `-b` writes binary to stdout, so pipe stdout
     to a write stream (avoids `maxBuffer` for multi-MB previews). Per candidate: require
     non-empty output, then validate (step 6); first that passes wins.
   - **magick (PSD/PSB/HEIC):** spawn args `['<src>[0]', '-auto-orient', '<tmp>.jpg']`
     (arg array, not a shell string). `[0]` **attempts** the flattened composite (present
     with Photoshop "Maximize Compatibility") / first HEIC image; layered files without a
     composite are best-effort (see tests).
6. **Validate before trusting:** open the candidate with `sharp().metadata()`; if it throws
   or reports zero width/height, treat as failure (catches empty/truncated/wrong-tag output).
7. Success → `rename()` the validated candidate into place (atomic; a killed/timed-out job
   never leaves a trusted-but-truncated cache file). Total failure/timeout → delete any
   leftover temp, record in `reportedFailures` (below), `log('error', …)`, and **throw**.

Binary paths: `picrConfig.exiftoolPath ?? 'exiftool'` / `picrConfig.magickPath ?? 'magick'`.

**`reportedFailures` scope (in-memory):** a Set keyed `file.id + '-' + fileHash + '-' +
decoder`, **consulted by `ensureDecodedImage` for all callers** (import, mutation, and lazy
HTTP). On failure it is logged **once** (filename, extension, decoder, reason) and recorded;
subsequent calls with the same key short-circuit (no re-spawn, no re-log). It is cleared
**only by process restart or a `fileHash` change** — i.e. semantics are "retry next boot /
when the file changes," not "retry later in the same process." This protects the lazy
`/image` path from thrash while still letting a restart's boot scan re-attempt.

### New helper: `backend/media/decodedImagePath.ts`

Mirrors `media/thumbnailPath.ts`, placed **inside `cache/thumbs/<relativePath>/`** so it
inherits `moveThumbnailFolder` on rename and hash-based invalidation:

```
cache/thumbs/<relativePath>/<name>-decoded-<hash>.jpg
```

### Boot capability probe: `backend/boot/checkOptionalMediaTools.ts` (NEW, non-fatal)

Modeled on `checkFfmpeg.ts` but **warns instead of `process.exit(1)`**. Probes and records a
runtime capability set `picrConfig.mediaCaps = { raw, psd, psb, heic }`:

- `exiftool -ver` present → `raw`.
- `magick -version` present, then parse `magick -list format`. Each row has a **Mode**
  column (e.g. `rw-`, `r--`, `-w-`); enable a format **only when its Mode includes `r`
  (read)** — mere presence is not enough. Probe **PSD, PSB, HEIC, HEIF as separate rows**
  (a build may list PSB independently of PSD, or list one without read support):
  - PSD row read → `psd`; PSB row read → `psb`; HEIC/HEIF row read → `heic`.
- Belt-and-suspenders (optional): a tiny fixture decode in tests confirms real read
  behavior beyond the flag parse.

`validExtension` and `decoderFor` both consult `mediaCaps` (`.psd` gated on `psd`, `.psb` on
`psb`, `.heic/.heif` on `heic`), so an unsupported format **stays `FileType.File`** instead
of being advertised-but-broken. Log a one-line summary of which of RAW/PSD/PSB/HEIC is
enabled and why.

**Ordering is load-bearing.** `app.ts` runs `configFromEnv(); checkFfmpeg();` synchronously,
then `detectVideoAcceleration().then(() => server())` — the fileWatcher and its initial scan
start inside `server()`. Because the initial scan calls `validExtension` (which reads
`mediaCaps`), the probe **must populate `mediaCaps` before `server()`**, or the first scan
classifies everything as `File` and only self-corrects on a later boot. So run the probe
**synchronously** (`spawnSync`, like `checkFfmpeg`) at `app.ts` right after `checkFfmpeg()`.
Note the sync/async split: the boot **probe** is sync (one-time, pre-serving); the runtime
**decode** in `ensureDecodedImage` is async (never blocks the request path). Default
`picrConfig.mediaCaps` to all-`false` so an un-run/failed probe fails safe.

## Wiring changes

### 1. Capability-gated classification + reclassification — `backend/filesystem/events/addFile.ts`

`validExtension` returns `FileType.Image` for `sharpReadableExtensions` plus any decodable
format **whose capability is enabled** (`mediaCaps`); else `FileType.File`. Import the format
lists from `shared/imageFormats`; drop the commented-out `.heic/.heif/.psd` lines.

**Reclassify existing 1.0 files with a `typeChanged` gate (no migration).** Today the
metadata/thumbnail block is gated `if (created || !file.fileHash || modified)`
(addFile.ts:106) and `file.type` is only assigned on the create/rename paths (lines 59, 80),
so an existing `.cr2` stored as `File` never upgrades. Because the watcher has no
`ignoreInitial` (`fileWatcher.ts:31`), the boot scan re-visits every file — so this is
sufficient:

```ts
const typeChanged = file.type !== type;
if (created || !file.fileHash || modified || typeChanged) {
  file.type = type; // persist reclassification
  ...
}
```

On the first boot after upgrade, each old RAW/PSD/HEIC re-evaluates to `Image` (caps
permitting) → `typeChanged` → reprocess. Same mechanism auto-retries files if a capability
appears later or a transient decode previously failed. Boot scan runs with
`generateThumbs=false`, so reclassification pays only the `ratio/metadata/blurhash` decode
cost (one-time, queued); thumbnails stay lazy. Do **not** bulk-clear `fileHash`.

### 2. Import fallback — never blackhole, never permanently sticky (`addFile.ts` Image branch)

The blackhole risk is **new and specific to `ensureDecodedImage` throwing** — the existing
native helpers all swallow errors and return fallbacks (`getImageRatio.ts:10` → `0`,
`getImageMetadata.ts:34` → `null`, `blurHash.ts:14` → `''`), and `generateThumbnail` catches
internally. So a corrupt native JPEG is **not** blackholed today (it becomes a visible image
with no thumbnail) and keeps that behavior. Only a `ensureDecodedImage` throw would otherwise
leave the row invisible, because that work runs before `file.exists = true` (line 154) and
`fileQueue.runQueueItem` (fileQueue.ts:68) merely logs the throw.

**Explicit failure signal:** call `const src = await ensureDecodedImage(file)` **once at the
top of the Image branch, inside a `try`** — do not rely on the swallowing helpers to signal
failure. Pass `src` to `getImageRatio`/`encodeImageToBlurhash`/`getImageMetadata`.

- Success → normal Image.
- `ensureDecodedImage` throws (decoded-format decode/validation failure) → **downgrade
  `file.type` to `FileType.File`**, clear image-only fields (`imageRatio = 0`, no
  blurhash/metadata), `log('error', …)`, and **still fall through to `exists = true` + DB
  update** so the file stays visible/downloadable.

Scope is **decoded formats only** (RAW/PSD/HEIC). It is **not sticky**: on the next boot scan
`validExtension` returns `Image` again → `typeChanged` → automatic retry.

### 3. Route the four sharp consumers through `ensureDecodedImage`

Single async source of a sharp-openable path:

- `media/generateImageThumbnail.ts` — replace `const fullPath = fullPathForFile(file)`
  (line 63) with `await ensureDecodedImage(file)`. (The lazy `/image` path reaches
  `generateThumbnail` directly, so it also benefits from the `reportedFailures` guard.)
- `media/getImageMetadata.ts` — currently opens `fullPathForFile(file)` (line 11) and
  **swallows** errors to `null`. Change it to accept the already-resolved `src` path (from
  addFile) so it reads the decoded preview and does **not** independently re-decode; its
  internal `try/catch` staying as-is is fine because the addFile-level `ensureDecodedImage`
  call is the authoritative failure signal.
- `addFile.ts` Image branch — pass the single decoded `src` to `getImageRatio(src)`,
  `getImageMetadata(file, src)`, and `encodeImageToBlurhash(src)`.

Disk caching + `reportedFailures` make repeat calls one `existsSync` (or an immediate
short-circuit).

**Known metadata limitation (document):** for RAW, EXIF/dimensions come from the embedded
preview, not sensor data — dimensions reflect the preview (usually full/near-full res,
correct aspect ratio); XMP star-rating may be absent. Future: read metadata via exiftool.

### 4. Lightbox display-vs-download — REQUIRED (`frontend/.../filesForLightbox.tsx:22`)

Currently `src: imageURL(file, canDownload ? 'raw' : 'lg')` displays the `raw` original for
downloadable galleries — broken for RAW/PSD/HEIC (and TIFF). Change display to a rendered
size while keeping `raw` for the download button (line 35, unchanged):

```ts
src: imageURL(file, isBrowserDisplayableOriginal(file.name) && canDownload ? 'raw' : 'lg'),
```

**Verified this is the only display change needed:** a grep of `frontend/src` + `app/src`
shows every other `imageURL(file, 'raw')` is a **video `<source>`** (`ImageFeed.tsx:154`,
`filesForLightbox.tsx:28`, app players) or a **download link** (`ImageFeed.tsx:215`,
`FileMenu.tsx:102`, app save handler) — none display an image `<img>` at `raw`.

### 5. App — NO code change, verify only

`app/src/components/PBigImage.tsx:27` already displays with `'lg'`; the `'raw'` at
`app/.../[fileId]/index.tsx:252` is the save-to-library/download handler (correct — we want
the original). So the app needs no change; just **verify RAW/PSD/HEIC save-to-library returns
the untouched original**.

### 6. Config — `backend/config/*`

- `IPicrConfiguration.ts` — add `exiftoolPath?`, `magickPath?`, and a `mediaCaps`
  (`raw/psd/psb/heic` booleans) populated by the boot probe.
- `envSchema.ts` — add optional `EXIFTOOL_PATH`, `MAGICK_PATH`.
- `configFromEnv.ts` — map them into `picrConfig` (like `ffmpegPath`, lines 50-51).
- `.env.example` — document `EXIFTOOL_PATH` / `MAGICK_PATH`.

### 7. Docker image — `Dockerfile`

Base is `node:24.13.0-alpine` (apk). Extend the existing `apk add` (lines 17-20):

```dockerfile
RUN apk add --no-cache ffmpeg exiftool imagemagick && \
    ... (existing amd64 VAAPI block unchanged)
```

Confirm the HEIC delegate (`magick -list format` in the built image; may need an added
`libheif`/heic apk package) and that `policy.xml` doesn't disable PSD or cap memory/disk too
low for PSB. RAW doesn't depend on ImageMagick delegates. A missing HEIC delegate degrades
gracefully via the capability probe.

## Files

**New:**

- `shared/imageFormats.ts`
- `backend/media/ensureDecodedImage.ts`
- `backend/media/decodedImagePath.ts`
- `backend/media/decoderFor.ts` (or co-locate in `ensureDecodedImage.ts`)
- `backend/boot/checkOptionalMediaTools.ts`

**Modified:**

- `backend/filesystem/events/addFile.ts` (capability-gated + `typeChanged` reclassification
  - import fallback)
- `backend/media/generateImageThumbnail.ts`, `getImageMetadata.ts`, `getImageRatio.ts`
  and/or `blurHash.ts` (decoded-path source)
- `backend/config/IPicrConfiguration.ts`, `configFromEnv.ts`, `envSchema.ts`
- boot registration file (calls `checkFfmpeg`)
- `frontend/src/components/FileListView/SelectedFile/filesForLightbox.tsx`
- `Dockerfile`, `.env.example`
- Docs: `backend/AGENTS.md` (Media Processing Pipeline), `shared/AGENTS.md`,
  `docs/development/*` supported-formats notes.

_(No `app/` code change; no `dbMigrate.ts` change.)_

## Verification

1. **Types/lint/format:** `cd shared && npx tsc --noEmit && npm run lint`; same for
   `backend` and `frontend`; then `npm run format:check`.
2. **Local tools:** `brew install exiftool imagemagick`; confirm `magick -list format` shows
   HEIC/PSD/PSB with **read (`r`) mode**.
3. **Manual end-to-end (`npm start`):** drop `.CR2`/`.NEF`/`.ARW`, `.psd`, `.psb`, `.heic`
   into a watched folder. Confirm each becomes `FileType.Image` with thumbnail + blurhash;
   `/image/:id/:size` serves sm/md/lg; intermediate lands at
   `cache/thumbs/<rel>/<name>-decoded-<hash>.jpg`; folder rename moves cached thumbs. Test
   the lightbox in a **downloadable gallery (`canDownload = true`)** specifically — that is
   the only case where `filesForLightbox.tsx:22` used `raw` — and confirm it now **displays**
   a rendered size while the **download** button still returns the untouched original.
4. **Reclassification (typeChanged):** with a `.cr2` pre-existing as `FileType.File`, restart
   → it becomes `Image` on the boot scan without a migration.
5. **Import-fallback + non-sticky retry:** feed a corrupt/undecodable RAW/PSD → it appears as
   `FileType.File`, logs an error, is not blackholed; restart with the tool now working → it
   reclassifies to `Image`.
6. **Boot capability probe:** confirm the `magick -list format` **Mode** column is parsed for
   read (`r`) support, and PSD/PSB/HEIC/HEIF are probed as separate rows. Run with `magick`
   lacking the HEIC delegate → HEIC stays `FileType.File`, boot logs "HEIC disabled"; if the
   build lists PSB without read support, `.psb` stays `File` while `.psd` still works; missing
   `EXIFTOOL_PATH`/`MAGICK_PATH` → server still boots and logs which formats are disabled.
7. **Async / no event-loop block + validation:** trigger a large PSB decode via lazy
   `/image` and confirm other requests are still served; confirm the timeout aborts a wedged
   decode; feed a format that yields empty/garbage output and confirm the sharp-metadata
   validation rejects it (no truncated cache file) and it's logged **once** (not per request).
8. **API tests (`tests/api`):** fixtures for a RAW, a **layered PSD**, a **PSB**, a **PSD
   without Maximize Compatibility**, and a HEIC; assert thumbnail generation (or the
   documented fallback). CI/Docker image must include the new binaries; local
   `npm run test:api` needs them installed. Run `cd backend && npm run build` and
   `npm run test:api` (CI-sensitive: Docker/boot/config touched); ask the user to run
   `npm run workflow` before pushing.
