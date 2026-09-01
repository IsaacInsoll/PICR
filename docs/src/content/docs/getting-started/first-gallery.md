---
title: Create your first gallery
description: Turn a media folder into a branded PICR gallery and share it with a recipient.
---

PICR publishes folders that already exist inside its media library. You do not upload originals through the browser: export, copy, or synchronise them into the mounted media folder using your normal workflow.

This guide takes one shoot from the filesystem to a tested recipient link.

## 1. Add a gallery folder

Create a folder below the host path mounted at `/home/node/app/media`, then place the client files inside it. For example:

```text
Client Media/
└── 2026-08 Smith Family/
    ├── IMG_0001.jpg
    ├── IMG_0002.jpg
    └── highlights.mp4
```

The folder becomes a gallery and its files become gallery items. Subfolders remain navigable sub-galleries.

PICR detects the new folder through the scan strategy configured during installation. If it does not appear yet:

1. Open the closest visible parent folder in PICR.
2. Open the folder menu and choose **Manage**.
3. Select **Scan Now**.

The first previews can take a little longer while thumbnails, metadata, and video posters are generated.

## 2. Give it a client-facing name

Open the new folder, then use its menu to choose **Manage**. On the **Folder** tab you can set:

- **Title** — the heading recipients see instead of the filesystem folder name
- **Subtitle** — optional context such as the shoot date or delivery note

The underlying folder name does not change. This lets you keep an internal naming convention such as `2026-08 Smith Family` while displaying `The Smith Family` to the client.

## 3. Choose gallery imagery

Open an image or video's menu and select **Set as hero image**. The hero represents the folder in previews and notifications.

For a large heading image, open an image's menu and select **Set as banner image**. Adjust its size and alignment in the preview. Videos can be hero images, but banner images must be still images.

These choices affect presentation only; PICR does not alter the original media.

## 4. Apply branding

In **Manage → Folder**, choose a branding preset or create one for the gallery. A folder without its own preset inherits branding from its nearest branded parent.

Branding controls colours, fonts, logo, gallery layout, available views, and footer links. See [Branding and theming](/PICR/galleries/branding/) for the full set of options.

## 5. Create a recipient link

Open **Manage → Links** and create a public link for the recipient. At minimum, give the link a recipient name. You can also choose:

- A generated or custom link ID
- An optional passcode and expiry time
- Proofing or final-delivery mode
- Whether the recipient can see or edit comments, ratings, and flags

Save the link, then copy its URL. Create a separate link for each person or team when you want independent access history, settings, or revocation.

[Users and recipient links](/PICR/sharing/users-and-links/) explains each access control, while [Proofing and final delivery](/PICR/sharing/delivery/) covers the two delivery modes. For this first gallery, the important part is to test the exact link you intend to send.

## 6. Check the recipient experience

Open the copied link in a private/incognito browser window. This avoids using your signed-in administrator session.

Check that:

- The title, subtitle, hero/banner, and branding look correct
- Only the intended folder and subfolders are visible
- The available gallery views suit the delivery
- Download controls match proofing or final-delivery mode
- Comments, ratings, and flags match the chosen permissions
- A passcode or expiry setting behaves as expected

Test on a phone-sized screen as well as a desktop before sending an important delivery.

## 7. Send and monitor the link

Send the tested URL through your normal client communication. PICR records recipient views and downloads unless access logging is disabled.

You can review activity from the dashboard or the folder's **Manage → Access Logs** tab. The PICR mobile app can notify signed-in users when a recipient opens a link; see [Notifications](/PICR/sharing/notifications/) for setup and supported events.

## What to learn next

- [Files and folders](/PICR/galleries/files-and-folders/) explains larger library structures and inheritance.
- [Browse, sort, and filter](/PICR/galleries/browsing/) covers gallery controls.
- [Branding and theming](/PICR/galleries/branding/) covers reusable presentation presets.
