# JPEG XL previews

JXL support uses the existing optional ImageMagick delegate. Unsupported or
unreadable files stay generic downloadable files. Originals are never rewritten.

## Colour and metadata

The production decode path is:

1. ImageMagick decodes the first frame and applies EXIF orientation.
2. ImageMagick writes an uncompressed, full-precision temporary PNG. Sharp reads
   this file after ImageMagick exits; it is not published as a cache entry.
3. Sharp explicitly converts the embedded ICC profile to sRGB before quantizing
   to an 8-bit PNG. Compression level 1 with adaptive filtering balances encoding
   time and cache space. EXIF and PNG text metadata are retained.
4. The resulting file is validated and atomically published under
   `decoded-jxl-v2`. Thumbnail JPEGs are generated from it through the normal
   thumbnail pipeline; there is no intermediate JPEG encode.

Do not substitute `-depth 8` before colour conversion. Also do not assume that
`toColorspace('srgb')` alone performs the intended ICC conversion for every input
depth. A 16-bit Display P3 fixture processed through the former path differed
from an independently ICC-converted sRGB reference by up to 24 channel levels
(mean absolute error 5.95). Explicit conversion before quantization reduced the
maximum to 2 and mean to 0.018. Forcing depth 8 before conversion gave a mean of
0.232 on that fixture. These are fixture results, not universal error bounds.

ImageMagick's PNG writer puts XMP in a `Raw profile type xmp` text field that
Sharp exposes through `metadata.comments`, not `metadata.xmp`. libvips can shorten
the keyword to `Raw` when re-encoding. `imageXmp()` recognizes the representation
by its profile name and validates its declared length and hex bytes. Ratings
can be serialized as RDF attributes or child elements; `imageRating()` handles
both, including multiple descriptions and the XMP rejected value of -1. ExifTool
seeing a rating in the PNG is insufficient proof that PICR can read it; the API
fixture asserts the rating through PICR's actual metadata reader.

The native decoder retains its 30-second process timeout. Decoder/conversion
failures remove the temporary transport and unpublished candidate. A timed-out
decoder is killed and its exit is awaited before cleanup. The cache never
substitutes a lower-quality preview or the original file for a missing thumbnail.

The file handoff avoids Sharp buffering the entire encoded transport PNG in
Node memory (roughly 138 MB for 23 MP or 360 MB for 60 MP 16-bit RGB, before
buffer copies). The temporary file needs that space on disk while conversion
runs. Native processing memory still grows with image dimensions, channels,
and source depth. No new per-file memory cap or pixel limit was added. The
two-CPU/2-GiB benchmark below is evidence for that input, not a peak-memory
profile or a bound for arbitrary images.

The 30-second timer is cleared when the external process closes. It is not an
end-to-end deadline for the subsequent Sharp conversion, validation, and
publication. No separate Sharp processing timeout was introduced.

## Full-resolution measurements

Measured on 2026-11-22 using the local production Docker image on an AMD Ryzen
9 7950X x86-64 host, limited to **two CPUs and 2 GiB RAM**, with
`MAGICK_THREAD_LIMIT=2`. ImageMagick used libjxl 0.11.1; Sharp was 0.35.5.

The input was a real 4035 × 5691 photograph (22.96 megapixels), derived from the
committed `Dog Photos/XH2A2139.jpg`. That fixture is an 8-bit, low-quality JPEG.
A small exposure adjustment in linear RGB produced nontrivial 16-bit sample
values before lossless JXL encoding. This exercises high-precision decoding at
full resolution; it does not recover genuine camera 16-bit detail or represent
every photograph's compressibility. The generated JXL was 9,473,834 bytes.

```sh
magick XH2A2139.jpg -auto-orient -colorspace RGB -evaluate Multiply 0.987 \
  -colorspace sRGB -depth 16 -define jxl:effort=1 -quality 100 photo.jxl
```

Each path ran three times against the same JXL. Times include decode and PNG
encoding, excluding fixture creation, metadata validation, and thumbnail JPEG
generation. File sizes use decimal MB.

| Path                                                   | Median     | Range           | Cached PNG  |
| ------------------------------------------------------ | ---------- | --------------- | ----------- |
| Previous 16-bit PNG with default compression           | 2.98 s     | 2.97–3.25 s     | 8.31 MB     |
| 16-bit PNG with compression level 1                    | 1.51 s     | 1.51–1.58 s     | 10.08 MB    |
| Depth 8 before ICC conversion, compression level 1     | 1.26 s     | 1.25–1.29 s     | 5.90 MB     |
| Earlier streaming ICC conversion, then fast 8-bit PNG  | 2.27 s     | 2.23–2.32 s     | 7.92 MB     |
| **Chosen: file-backed ICC conversion, then 8-bit PNG** | **2.49 s** | **2.48–2.91 s** | **7.92 MB** |

The selected path preserves the intended colour conversion while improving this
input's decode time and cache size relative to the original implementation.
The file-backed measurement includes temporary-file removal and uses a
137,867,884-byte transport PNG, removed before publication. It avoids the large
Node stream buffer at a modest time cost on this host; peak native memory was
not measured. Both normalization paths produced the same PNG size and 8-bit
depth on this input.
Neither a CPU quota nor this sample proves performance on an actual NAS, and
larger or noisier images can require substantially more work. Do not infer a
universal PNG size or timeout guarantee from these measurements.

## Release note

JPEG XL thumbnails and previews are supported when ImageMagick's JXL reader is
available; the official image bundles it. The first upgraded scan decodes
existing JXL files that become supported images to read metadata, dimensions,
and blurhashes, creating cached PNG intermediates even when boot-time thumbnail
generation is disabled. Large JXL libraries can therefore take longer to scan
and grow the cache on first upgrade. The new capability tracking also permits a
one-time attempt for existing generic RAW, PSD/PSB, and HEIC/HEIF files whose
decoder is available. Unchanged files, including failed decode attempts, are
not decoded on every subsequent boot with the same capabilities. JPEG thumbnail generation remains scoped to new
arrivals, explicitly requested galleries, or on-demand requests.

Embedded XMP ratings serialized as child elements or across multiple RDF
descriptions are now recognized. Malformed or out-of-range embedded ratings
resolve to zero. Existing metadata changes only when a file is reprocessed;
these embedded ratings are separate from users' stored proofing ratings.

## Validation and remaining limitations

Direct checks through production `ensureDecodedImage()` confirmed that the
16-bit landscape, portrait, and Display P3 fixtures, plus the full-resolution
16-bit photo, produce cached PNGs with Sharp metadata `depth: 'uchar'` and
`bitsPerSample: 8`. The size alone was not used to infer depth. The native JXL
integration test now inspects each production cached PNG inside Docker and
asserts both fields, as well as the absence of temporary files after success.

The shared, unchanged `encodeImageThumbnailVariants()` has a separately
reproduced colour bug for 16-bit Display P3 PNG and TIFF inputs. Generated JPEGs
differed from the independently converted sRGB reference by up to 23 channel
levels (mean 5.85). An explicit ICC-conversion control reduced the maximum to 3
and mean to 0.588. This verification did not cover Adobe RGB or ProPhoto.

## Resumable capability upgrades

The scanner keeps its matching-content-hash shortcut. A row's type differing
from the extension's expected type is not enough to reprocess it: corrupt and
unsupported images both remain generic downloadable files.

Generated migration `0031_media-decode-attempts` adds nullable
`ServerOptions.mediaDecodeState` and `Files.imageDecodeAttempt`. At boot, each
optional decoder's persisted generation increases only on an unavailable-to-
available transition. A generic file gets one processing attempt in that
generation. Its attempt key, classification, and content hash are saved together,
including failure. If boot is interrupted before that write, the unfinished
file remains eligible; already attempted files are skipped. No in-memory work
queue or whole-library completion flag is needed.

This applies to watcher ingestion and scanner paths. Capability loss preserves
unchanged existing image rows. A later recovery permits one new attempt for
generic files, while already successful images retain their caches. Source
changes still trigger normal reprocessing. A failed Sharp-readable image does
not participate in optional-decoder promotion. After repairing permissions on
an unchanged failed file, update its mtime and rescan to permit another attempt;
a restart alone deliberately does not erase the durable attempt marker.

Tests cover failed JPEG, PNG, TIFF, PSD/PSB, HEIC, JXL, and RAW processing across
cleanup passes, subsequent scans, and simulated restarts, capability loss and
recovery, source changes, and unfinished promotion. The native integration test
also checks unchanged failed JPEG/JXL database rows across a real backend restart
and promotes a pre-support JXL row without replacing its identity.
