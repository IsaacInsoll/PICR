---
title: Browse, sort, and filter
description: Choose gallery layouts and find files using PICR's sorting, filtering, metadata, and review controls.
---

PICR offers three web gallery views. The controls available to a recipient can be restricted by the folder's branding preset.

## Choose a gallery view

- **Gallery** — a thumbnail grid for scanning a large set quickly. Branding can use justified or masonry layout and control thumbnail size and spacing.
- **Feed** — larger media displayed in a vertical sequence, useful for storytelling and smaller selections.
- **List** — a compact table with filenames and useful details, suited to production and review work.

Changing the view updates the URL and remembers the choice in that browser. If a public-link recipient's saved choice is not allowed by the gallery branding, PICR uses the configured default or the first available view.

Administrators can decide which views recipients may use and select the initial view under [Branding and theming](/PICR/galleries/branding/).

## Sort a gallery

Use **Sort** to choose an order. Selecting the active option again reverses its direction.

Available choices depend on the folder contents and review permissions:

- **Filename** — alphabetical or reverse-alphabetical
- **Last modified** — most or least recently changed
- **Date taken** — capture date when image metadata is available; otherwise PICR falls back to modification time
- **Recently commented** — files with the newest review activity first or last
- **Rating** — highest- or lowest-rated files first

When files and subfolders appear together, the folder control can keep folders grouped first or interleave them with files.

PICR remembers the viewer's sort selection in that browser and includes it in the URL. A branding preset can provide the default used before a viewer chooses their own order.

## Filter files

Open the folder menu and choose **Filter files**. Filters apply together, so you can narrow a gallery by several conditions at once.

The basic filters are:

- Filename text
- Landscape, square, or portrait aspect ratio
- Available image metadata values

When review information is visible, filters also include:

- Approved, rejected, or unflagged files
- Star rating
- Whether a file has comments

PICR shows how many files match and lets you clear all active filters. Filters reset when you move to another folder; they are a temporary view of the current gallery, not a change to its contents.

## Open a file

Select a photo or video to open the full-screen viewer. From there you can move through the currently filtered set and, when permitted:

- Download the original file
- Inspect file and capture metadata
- Read or add comments
- Set a star rating
- Approve or reject the item

Administrators can also set an image or video as the folder hero from its menu. Still images can be used as the folder banner.

## Download a folder

When downloads are allowed, the folder menu offers a ZIP download. PICR prepares the archive in the background and reuses it while the folder contents remain unchanged.

Public links in proofing mode do not offer normal individual or ZIP download controls. The sharing guide covers proofing and delivery in detail.

## Export a selection

Signed-in users can use **CSV Export** from the folder menu. The export can:

- Follow the current sort order
- Include only files matching the current filters
- Include subfolders
- Keep or remove extensions
- Produce PICR review data for the Lightroom Classic plugin, a comma-separated filename list, or a space-separated list

Use this after filtering by rating or approval when you need a selection for another tool.
