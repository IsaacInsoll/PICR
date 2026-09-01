---
title: Comments, ratings, and flags
description: Collect recipient feedback and turn it into a practical image-selection workflow.
---

PICR provides three forms of review feedback on individual files:

- **Comments** — free-form notes about retouching, selection, delivery, or another file-specific detail
- **Ratings** — zero to five stars; zero means unrated
- **Flags** — approved, rejected, or no flag

Comments belong to a file, not a folder. Folder activity views collect those file-level events into a useful timeline.

## Choose review permissions

Review permissions are set separately on every administrator account and public link.

| Permission | Read feedback | Add comments | Change rating or flag |
| ---------- | :-----------: | :----------: | :-------------------: |
| **None**   |      No       |      No      |          No           |
| **Read**   |      Yes      |      No      |          No           |
| **Edit**   |      Yes      |     Yes      |          Yes          |

With **None**, PICR hides the review interface. Use **Read** when someone should see decisions without changing them, and **Edit** for active proofing.

## Understand shared review state

A file has one current rating and one current flag. Everyone with permission sees that same state, so a later authorised change replaces the visible rating or flag for the file.

PICR also records feedback events in the activity history. Comments are appended rather than replacing earlier comments, making them suitable for an ongoing conversation about a file.

When several decision-makers need independent selections, give them separate folders or agree on a shared convention. Separate public links provide separate access identity and permissions, but they do not create separate per-recipient ratings or flags on the same file.

## Design a clear client workflow

Tell the recipient exactly which control carries the decision. For example:

> Approve every image you want included in the final set. Leave a comment on an image when you have a retouching note.

Or:

> Rate possible selections with one star, then narrow the strongest choices to two stars. Your final two-star set will be edited and delivered.

Avoid asking for ratings and flags simultaneously unless each has a distinct meaning.

## Review the results

As a signed-in user, you can:

- Open the folder's **Activity** view to see recent feedback
- Use list view to compare filenames, ratings, flags, comments, and other details
- Sort by rating or recent comments
- Filter by flag, rating, or whether a file has comments
- Combine review filters with filename, aspect-ratio, and metadata filters

Filters apply to the current folder and reset when you move elsewhere. See [Browse, sort, and filter](/PICR/galleries/browsing/) for the complete control set.

## Export a selection

Choose **CSV Export** from the folder menu after sorting or filtering. You can export only the visible selection and optionally include subfolders.

Available formats include:

- PICR plugin CSV with filename, rating, and flag
- Comma-separated filenames
- Space-separated filenames

The export can retain or remove filename extensions. Use it to feed a selected set into another tool or script.

## Sync with Lightroom Classic

The bundled [Lightroom Classic plugin](/PICR/integrations/lightroom/) imports PICR ratings and flags into the matching Lightroom folder. It matches by filename without the extension, allowing a JPEG proof such as `IMG_0001.jpg` to match a RAW original such as `IMG_0001.CR3`.

Comments are not imported into Lightroom by the current plugin.

## Notifications

PICR can notify eligible signed-in users when a recipient comments, rates, or flags a file. The person who made the change is excluded from that notification. See [Access logs and notifications](/PICR/sharing/notifications/) for setup.
