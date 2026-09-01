---
title: Media and thumbnails
description: Understand PICR's image, RAW, video, generic-file, metadata, and thumbnail support.
---

PICR indexes media from the mounted library, extracts available metadata, and creates cacheable previews without modifying the originals.

The official Docker image includes FFmpeg, ExifTool, ImageMagick, and HEIC support. Open **Settings → Media** to see which additional image capabilities PICR detected on the running server.

## Image formats

PICR directly reads these common image formats:

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)
- TIFF (`.tif`, `.tiff`)
- SVG (`.svg`)

PICR can also decode previews for:

- Camera RAW formats including CR2, CR3, NEF, NRW, ARW, DNG, RAF, ORF, RW2, PEF, and other common RAW extensions
- Photoshop PSD and PSB
- HEIC and HEIF

RAW preview support depends on ExifTool. PSD, PSB, HEIC, and HEIF preview support depends on ImageMagick and the relevant decoder. These are bundled in the official image but may be absent from a custom installation.

If a recognised advanced format cannot be decoded, PICR keeps it as a generic file rather than presenting a broken image preview.

## Video formats

PICR identifies these video containers:

- MP4 and M4V
- MOV and QuickTime
- AVI
- WMV
- WebM
- FLV
- MKV

FFmpeg and FFprobe extract metadata and create poster/scrub previews. Actual playback still depends on the codecs supported by the recipient's browser and device. A recognised container is not a guarantee that every browser can decode the video stream inside it.

For widest client compatibility, H.264 video with AAC audio in an MP4 container remains a practical delivery choice.

## Other files

Files with another extension appear as generic files rather than image or video previews. Extensionless files are ignored.

This lets a gallery folder contain supporting material without PICR trying to interpret it as media. Test the recipient workflow for a particular document type before relying on it as part of a delivery.

## Metadata

PICR displays available file and capture details and uses metadata for features such as capture-date sorting and metadata filtering.

Metadata varies by format and by the source application. A missing capture date falls back to filesystem modification time for date-based sorting.

PICR reads metadata; it does not write edits back into original media.

## Thumbnail cache

Generated previews live in the mounted cache directory, not beside the originals. The cache includes multiple JPEG widths so browsers can request an appropriate size for the layout and screen.

The cache is regenerable:

- It does not need to be part of normal backups.
- You can clear its contents when reclaiming storage.
- Do not delete the cache directory itself unless you recreate its ownership and write permissions.
- A cold cache makes the first gallery views slower while previews regenerate.

See [Troubleshooting](/PICR/operations/troubleshooting/#thumbnails-not-showing--permission-denied-errors) for cache permission errors.

## Pre-generate thumbnails

PICR normally queues previews when it discovers new media and can generate missing sizes on demand.

For a gallery that must feel complete on first client open:

1. Open the folder menu.
2. Choose **Manage → Folder**.
3. Select **Generate Thumbnails**.
4. Allow the background task to finish before testing the public link.

Large video and RAW imports take longer than JPEG-only galleries because decoding and metadata work are more expensive.

## Media settings

Open **Settings → Media** to configure:

- **Use originals in the lightbox** — uses a browser-displayable original where appropriate instead of the large generated preview. This can improve close inspection but increases bandwidth and decode cost.
- **Thumbnail JPEG quality** — an integer from 1 to 100; the default is 80. Higher quality uses more cache space and network bandwidth.

Changing thumbnail quality changes the generated variant identity. New requests use the new quality; older cache files can be removed later by clearing the cache if space is needed.

## Thumbnail workers

PICR chooses a thumbnail-worker count based on CPU and memory, capped at eight by default. On a small NAS, reduce concurrency when imports compete with other services:

```yaml
environment:
  THUMBNAIL_WORKERS: '2'
```

The Docker image sets `UV_THREADPOOL_SIZE=8`. Raising worker count above the native threadpool usually adds memory pressure without improving throughput; benchmark changes on your own server.

## Hardware video acceleration

The `amd64` image can detect Intel or AMD VAAPI hardware when `/dev/dri` is passed into the container. Detection and codec information appear under **Settings → Media**.

PICR currently creates normal video poster and scrub thumbnails on the CPU because that workload benchmarked faster there. VAAPI support is groundwork for future video processing and is mainly exposed through the benchmark today.
