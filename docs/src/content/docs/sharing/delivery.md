---
title: Proofing and delivery
description: Choose whether recipients can download files and understand the limits of browser-based proofing.
---

Each public link has a mode that matches one of two common stages in a photography workflow.

| Mode               | Intended use                                                     | PICR download controls                            |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------- |
| **Proofs only**    | Selection, comments, ratings, and approval before final delivery | Hidden; folder ZIP generation is rejected         |
| **Final delivery** | Delivering files the recipient is allowed to save                | Individual and folder ZIP downloads are available |

Change the mode by editing the public link. Other links to the same folder keep their own mode.

## Proofs only

Proof mode removes PICR's normal individual download buttons, folder ZIP action, drag behaviour, and direct-original source from the lightbox. The backend also rejects a proof link that attempts to generate a ZIP.

:::caution[Proofing mode is not DRM]
This discourages casual downloading and keeps the interface focused on review. It is not digital rights management. Anything rendered by a web browser can potentially be captured, and previously obtained media URLs are not revoked when a link changes mode.

Use proof-sized exports, watermarks, or other workflow controls when the consequence of copying is significant. Do not rely on a browser control as a guarantee that pixels cannot be saved.
:::

## Final delivery

Final-delivery links can download:

- An individual original from the file menu or full-screen viewer
- The current folder as a ZIP from the folder menu

ZIP creation runs in the background. PICR reuses a generated archive while the folder contents remain unchanged and creates a new one when necessary.

On iPhone and iPad, PICR uses the native share sheet for supported photos and videos so the recipient can choose **Save Image**, **Save Video**, or another destination. ZIP and other generic downloads use the browser's normal file-saving flow.

## Deliver a reviewed selection

A common workflow is:

1. Create a proofs-only link with **Edit** review permission.
2. Ask the recipient to rate or approve the wanted files.
3. Filter the gallery to that selection as a signed-in user.
4. Export the selection to Lightroom, or place the finished files in a delivery folder.
5. Create a final-delivery link for the finished folder, or change the existing link mode when the same folder is appropriate.

Keeping proofs and finished files in separate folders makes it easier to preserve a clear delivery boundary and prevents accidental access to working exports.

## Downloads and activity

PICR records folder ZIP generation as download activity for the public link and can notify eligible signed-in users. Repeated identical activity is deduplicated to avoid log and notification spam.

:::note[Apply access controls before sharing]
Direct media delivery is content-addressed for caching and performance. Disabling or expiring a gallery link prevents future gallery navigation, but does not recall a raw media URL or file already received.
:::

## Delivery checklist

Before sending a final link, test it in a private/incognito browser and confirm:

- The link opens the intended folder and descendants only
- The link is in **Final delivery** mode
- Individual and ZIP downloads work
- The folder contains only files intended for delivery
- Passcode and expiration settings are correct
- The public `BASE_URL` uses HTTPS and points to the expected host
