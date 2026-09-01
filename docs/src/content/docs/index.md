---
title: PICR
description: Self-hosted photo and video galleries for photographers and their clients.
---

PICR turns folders on your server or NAS into branded photo and video galleries. Your originals stay in your own storage; PICR indexes them, creates previews, and gives each client a purpose-built gallery instead of a generic shared drive.

Start with [Install PICR](/PICR/getting-started/install/), or jump directly to the topic you need from the manual navigation.

![PICR galleries displayed on desktop and mobile devices](../../../images/picr-header.png)

## A typical PICR workflow

1. Export a shoot into a folder inside your mounted media library.
2. Let PICR detect it, or scan the folder manually.
3. Add a client-facing title, branding, and a gallery image.
4. Create a public link for that recipient.
5. Receive a notification when the link is opened.
6. Collect comments, ratings, or approvals, then deliver the finished files.

Because the media library remains an ordinary filesystem, you can keep using Lightroom, a NAS share, synchronisation software, or your existing archive process alongside PICR.

## What PICR provides

- Responsive photo and video galleries with list, gallery, and feed layouts
- Named branding presets with gallery-specific colours, typography, logos, and layout choices
- Separate recipient links with optional passcodes, expiry dates, proofing controls, and review permissions
- Link-open, download, comment, rating, and flag activity
- Push notifications through the PICR mobile app and optional ntfy notifications
- Comments, star ratings, approve/reject flags, CSV export, and a Lightroom Classic plugin
- Read-only media access by default, with optional controlled rename and move support
- 🇺🇸 English, 🇫🇷 French, 🇩🇪 German, 🇬🇷 Greek, 🇪🇸 Spanish, and 🇺🇦 Ukrainian web interfaces

## Start here

- [Install PICR](/PICR/getting-started/install/) with Docker and prepare its media, cache, and database storage.
- [Create your first gallery](/PICR/getting-started/first-gallery/) from a folder and check the recipient experience.
- Learn [how PICR uses files and folders](/PICR/galleries/files-and-folders/).
- Learn how to [browse, sort, and filter a gallery](/PICR/galleries/browsing/).

The remaining sections cover branding, sharing, proofing, notifications, operations, and integrations in more detail.

## Project links

- [GitHub repository](https://github.com/IsaacInsoll/PICR)
- [Docker Hub](https://hub.docker.com/r/isaacinsoll/picr)
- [Releases and changelog](https://github.com/IsaacInsoll/PICR/releases)
- [Developer documentation](https://github.com/IsaacInsoll/PICR/blob/master/docs/development/index.md)

PICR is source-available under the Business Source License 1.1. Each release converts to GPLv3 after four years; see the repository `LICENSE` for the legal terms.
