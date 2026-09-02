---
title: Users and public links
description: Control signed-in access and create separate gallery links for recipients.
---

PICR has two customer-facing access types:

- **Administrator accounts** sign in with a username and password. They manage galleries within their assigned folder tree and can use the mobile app.
- **Public links** give a recipient browser access without a PICR account. Each link has its own identity, folder scope, status, and sharing controls.

Create administrator accounts under **Settings → Admin Users**. Create public links from a folder's **Manage → Links** tab or under **Settings → Public Links**.

## Folder scope

Every account and public link has a home folder. It can access that folder and its descendants, but not its parent or siblings.

For example, a link assigned to `Commercial/Porsche` can open every shoot below `Porsche`. A link assigned to `Commercial/Porsche/Taycan Launch` cannot browse back to the rest of the Porsche library.

:::tip[Use the narrowest useful folder]
Folder structure is part of PICR's access model. Assign the narrowest folder that contains everything the person needs.
:::

## Administrator accounts

An administrator account includes:

- Name, username, and password
- Enabled or disabled status
- Home folder
- Comment, rating, and flag permissions
- Optional ntfy notification settings

Administrators can manage galleries and create public links only within their folder tree. An administrator whose home folder is the media root has access to the entire library. A scoped administrator can create or manage accounts below their own scope, but cannot grant access above it.

Disabling an account stops it signing in without deleting its configuration. The original root administrator cannot be deleted.

Use an email address as the username for anyone who will use the PICR mobile app; the current app login validates usernames as email addresses. Passwords must contain at least eight characters.

## Public links

A public link normally looks like:

```text title="Example public link"
https://clients.example.com/s/smith-family-a7kd/
```

The value after `/s/` is the link ID. It must contain at least six characters and cannot contain PICR's reserved path characters. The editor can generate either a readable ID based on the folder or a random one.

Each link has:

- **Recipient name** — required and used in activity and notifications
- **Email** — optional reference information for the photographer
- **Link ID** — generated or customised before sharing
- **Enabled state** — immediately permits or denies gallery access
- **Passcode** — optional extra prompt before the gallery loads
- **Expiration** — optional date and time after which PICR rejects the link
- **Link mode** — final delivery or proofs only
- **Review permissions** — none, read, or edit

The recipient name matters even when several links point to the same folder: it lets access logs and notifications identify which link was used.

## One link per recipient

Prefer a separate link for each person or team when you want to:

- See who opened or downloaded a gallery
- Give different passcodes, expiry dates, or review permissions
- Disable one recipient without affecting another
- Separate proofing from final delivery

If everyone deliberately shares the same access and identity, one link can be sent to the group instead.

## Passcodes and link IDs

The unguessable link ID is the primary access credential. A passcode adds another check, but it does not turn the link into a signed-in account.

Share the passcode separately when the gallery is sensitive. Use HTTPS so the link, passcode, and gallery traffic are encrypted in transit.

Changing a link ID changes the gallery URL. Copy and test the new URL before sending it again.

## Expiration, disabling, and deletion

- **Expiration** automatically rejects the link after the selected instant. The editor uses the administrator's local date and time.
- **Disable** is reversible and is useful for temporarily withdrawing access.
- **Delete** removes the public-link record from normal use.

:::caution[Access changes are not file recall]
These controls stop future gallery API access through that link. They do not retract files already downloaded or invalidate an independent media URL a recipient previously obtained.
:::

## Review permissions

The comment permission applies to comments, ratings, and approve/reject flags:

| Permission | Recipient experience                                       |
| ---------- | ---------------------------------------------------------- |
| **None**   | Review controls and existing review activity are hidden    |
| **Read**   | Existing review activity is visible, but cannot be changed |
| **Edit**   | Comments can be added and ratings or flags can be changed  |

See [Comments, ratings, and flags](/PICR/sharing/reviews/) for workflow details.

## Avatars and Gravatar

PICR uses [Gravatar](https://gravatar.com/) for account and recipient avatars when an email address is present. It hashes the normalised email address with SHA-256 before constructing the Gravatar request.

If no Gravatar is registered, PICR displays the person's initials with a generated colour.

## Test before sending

Open each finished public link in a private/incognito browser window. Confirm its folder scope, passcode, expiry, download mode, and review permissions without relying on your signed-in administrator session.
