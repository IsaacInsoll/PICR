---
title: Browse, sort, and filter
description: Choose gallery layouts and find files using PICR's sorting, filtering, metadata, and review controls.
---

PICR offers three web gallery views. The controls available to a recipient can be restricted by the folder's branding preset.

## Choose a gallery view

- **Gallery** — (typical photo gallery). a thumbnail grid for scanning a large set quickly. Branding can use justified or masonry layout and control thumbnail size and spacing.
- **Feed** — (instagram lots-of-scrolling style) larger media displayed in a vertical sequence, useful for storytelling and smaller selections.
- **List** — (google drive style) a compact table with filenames and useful details, suited to production and review work.

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

Choose **Filter** beside the gallery controls. Filtering narrows the files directly in the folder you are viewing, without replacing its layout or hiding its subfolder tiles. Filters apply together, so you can combine several conditions.

The basic filters are:

- Photos or videos
- Landscape, square, or portrait aspect ratio
- Available image metadata values

When review information is visible, filters also include:

- Approved, rejected, or unflagged files
- Star rating
- Whether a file has comments

PICR shows how many files match and lets you remove individual filters or clear them together. Visible filters follow you when you deliberately open a subfolder, so you can apply a rule such as **5 stars** and inspect each part of a shoot. They remain a view of the gallery and never change its contents.

Camera, lens, aperture, shutter-speed, and ISO choices describe files loaded in the current folder. They therefore remain current-folder filters and are paused—not silently discarded—if you open recursive Results.

## Find files across folders

Use the visible **Find** field when you want matching files from the current folder and everything inside it. This opens a clearly labelled Results view rather than changing the meaning of the gallery behind you.

Find can match:

- Filename text
- A folder name or path below the folder where you started
- Media type, orientation, rating, flag, and comment filters

For example, a business client can open its top-level folder, search for `social`, and see matching videos from every shoot folder. Results contain files rather than folder tiles, retain each file's folder context, and can be narrowed with the Folder control.

When local gallery filters also have matches in subfolders, PICR offers **Show all** to carry the supported filters into recursive Results. Administrators can also hand the file matches from **Quick Find** into Results; Quick Find itself remains a navigation tool for locating files and folders.

Results load progressively. Opening a file lets you move through the loaded result sequence across folder boundaries. Rating, flag, and comment changes do not make tiles jump or disappear while you are reviewing; PICR shows a **Refresh** action when those changes could alter membership or order.

## Open a file

Select a photo or video to open the full-screen viewer. From there you can move through the current gallery or Results selection and, when permitted:

- Download the original file
- Inspect file and capture metadata
- Read or add comments
- Set a star rating
- Approve or reject the item

Administrators can also set an image or video as the folder hero from its menu. Still images can be used as the folder banner.

## Download a folder

When downloads are allowed, PICR offers a ZIP download. If filters or recursive Results are active, the Download menu distinguishes the files currently shown from the entire folder tree. A Results selection that changed during review must be refreshed before PICR can prepare an exact filtered archive.

:::note[Proofing links hide downloads]
Public links in proofing mode do not offer normal individual or ZIP download controls. The [proofing and delivery guide](/PICR/sharing/delivery/) explains the behaviour and its limits.
:::

## Export a selection

Signed-in users can use **Export filenames** from the folder menu. The export can:

- Follow the current sort order
- Include only files matching the current filters
- Include subfolders
- Keep or remove extensions
- Produce PICR review data for the Lightroom Classic plugin, a comma-separated filename list, or a space-separated list

Recursive exports are generated by the server and are not limited to the files currently loaded in the browser. Camera and exposure metadata filters cannot be combined with **Include subfolders**; narrow the export to the current folder or clear those filters. Use an export after filtering by rating or approval when you need a selection for another tool.
