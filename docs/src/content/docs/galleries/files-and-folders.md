---
title: Files and folders
description: Understand PICR's filesystem-backed library and organize galleries for different client workflows.
---

PICR treats the directory mounted at `/home/node/app/media` as the root of its library. Every directory below it can be opened as a gallery, and its files appear as gallery items.

PICR does not replace your storage or import originals into a private library. You continue to add and organise media through Lightroom exports, a network share, synchronisation software, or the host filesystem.

## The library mirrors your filesystem

Given this host folder:

```text
Client Media/
├── Families/
│   ├── 2026-08 Smith Family/
│   └── 2026-09 Jones Family/
└── Commercial/
    └── Porsche/
        ├── Taycan Launch/
        └── Christmas Party/
```

PICR shows the same hierarchy. A link to `Porsche` includes its shoot subfolders, while a link to `Taycan Launch` starts at that gallery and does not expose its parent or sibling folders.

This makes the folder chosen for a user or public link its access boundary. Access includes that folder and everything below it.

## Filesystem names and display names

PICR normally displays a folder's filesystem name. Administrators can add a separate **Title** and **Subtitle** under **Manage → Folder**.

For example:

- Filesystem folder: `2026-08 Smith Family`
- Display title: `The Smith Family`
- Subtitle: `August 2026`

The display fields change the gallery heading without renaming the folder on disk. Folder lists continue to use the filesystem name, making it easier for administrators to match PICR with the NAS or server.

## How changes are detected

PICR scans the media root at startup and can detect later changes through native filesystem events, polling, on-view scans, scheduled scans, or [PICR Ping](/PICR/operations/picr-ping/). [Scanning and change detection](/PICR/operations/scanning/) explains when to use each strategy.

If a folder is missing or out of date:

1. Open its closest visible parent.
2. Choose **Manage** from the folder menu.
3. Select **Scan Now**.

Use **Generate Thumbnails** from the same page when you want to queue previews for the folder instead of waiting for each item to be requested. PICR never writes thumbnails beside the originals; they are stored in the cache volume.

## Folder presentation

Each folder can have:

- A display title and subtitle
- A hero image or video used to represent it
- A still-image banner for the gallery heading
- A branding preset, or inherited branding from a parent
- One or more public links
- Its own access-log view

Set hero and banner images from a media item's menu. Configure the other settings from the folder's **Manage** page.

## Organising repeat clients

There is no single required folder structure. Two useful patterns are:

### One link per shoot

```text
Families/
├── 2026 Smith Family/
└── 2027 Smith Family/
```

Create a new public link on each shoot folder. This keeps deliveries and access history independent and makes it easy to expire an older gallery.

### One continuing client library

```text
Commercial/
└── Porsche/
    ├── Taycan Launch/
    ├── Staff Portraits/
    └── Christmas Party/
```

Create a link on `Porsche` when the recipient should see all current and future shoots below it. New subfolders appear within the same accessible tree after PICR detects them.

Use separate recipient links on the same folder when multiple people need access. Their passcodes, expiry, permissions, last-access time, and access logs remain independent.

## Rename and move safety

PICR is read-only by default, so filesystem changes normally happen outside the application.

PICR attempts to recognise moves and renames, but not every filesystem exposes enough stable identity information. If an external rename looks like a deletion followed by a new folder, PICR may lose the database relationships that held its links, branding assignment, comments, and ratings.

For important galleries:

- Prefer a stable folder structure after links and reviews exist.
- Keep backups of both the media library and PostgreSQL database. See [Backups and upgrades](/PICR/operations/backups-and-upgrades/) for a restorable backup procedure.
- If you need frequent moves or renames, read [Enable rename and move access](/PICR/operations/write-access/). PICR's own move/rename operation preserves the database relationships, but requires deliberately granting media write access.

## Deleting files

Removing a file or folder from the media library removes it from the gallery after PICR detects the change. The original deletion happens through your filesystem workflow, not PICR's normal read-only interface.

Before removing reviewed media, consider whether you still need its comments, ratings, flags, link history, or Lightroom export. Keep the database backup aligned with the media backup if you need a restorable record of the gallery.
