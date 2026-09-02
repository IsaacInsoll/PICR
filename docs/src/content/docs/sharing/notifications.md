---
title: Access logs and notifications
description: Track recipient activity and receive mobile or ntfy alerts when a gallery is opened or reviewed.
---

PICR records public-link activity so photographers can answer two useful questions: which recipient link was used, and what happened in the gallery?

Push notifications through the PICR mobile app are the simplest way for signed-in users to know when a recipient opens a link.

## Access logs

Open **Settings → Access Logs** for activity across your account scope, or open a folder's **Manage → Access Logs** tab for that gallery.

Logs identify the public link, folder, time, event type, IP address, and browser/device information available with the request. PICR records gallery views and folder ZIP downloads.

To avoid filling the database with refreshes, an identical link, folder, activity type, IP address, session, and browser combination is logged at most once per hour.

:::caution[Access logs power link-open notifications]
`DISABLE_ACCESS_LOGS=true` stops new view and download logs. Existing rows remain in PostgreSQL, but link-view and folder-download notifications are also suppressed.
:::

## Notification events

PICR can notify signed-in users about:

- A public link viewing a gallery
- A public link generating a folder download
- A comment added to a file
- A file being rated
- A file being approved or rejected

Notifications go to eligible signed-in users whose home-folder scope contains the affected folder. The user who created a feedback event is not notified about their own action.

Link-open notifications are throttled: after a link records a real visit, another open from that link does not create a new view alert for 30 minutes. Access-log deduplication is a separate one-hour check based on request identity.

## Mobile push notifications

The PICR mobile app is for signed-in users, not public-link recipients. Its main notification workflow is:

1. A recipient opens a public gallery link in their browser.
2. The PICR server records the visit and sends an Expo push notification.
3. The signed-in user receives the recipient name and gallery information.
4. Tapping the notification opens the relevant administrator gallery in the app.

Install the app, sign in to your server, open **Settings**, grant the operating-system notification permission, and enable **Allow Notifications**. Push registration requires a physical device.

See [PICR mobile app](/PICR/integrations/mobile-app/) for login requirements and store links.

## ntfy notifications

[ntfy](https://ntfy.sh/) remains available when you prefer a separate notification service or want notification email delivery.

1. Install an ntfy client or choose an ntfy server.
2. Create a long, unguessable topic, for example `picr-name-random-characters`.
3. In PICR, edit the signed-in administrator account that should receive notifications.
4. Enter its full ntfy topic URL, such as `https://ntfy.sh/picr-name-random-characters`.
5. Optionally enable ntfy email delivery when the account username is an email address.

:::caution[Keep the ntfy topic private]
Treat the topic URL as a secret: anyone who knows a public ntfy topic may be able to subscribe to it. Self-host ntfy or review its service terms if notification metadata is sensitive.
:::

Email delivery is subject to the [ntfy server's rate limits](https://docs.ntfy.sh/publish/#e-mail-notifications).

## Disabling logs also affects notifications

When `DISABLE_ACCESS_LOGS=true`, PICR also suppresses link-view and folder-download notifications because they share the access-recording path.

Comment, rating, and flag notifications use their own feedback path and continue unless their notification destination is disabled.

## Troubleshooting push notifications

- Confirm the administrator's home folder contains the gallery being opened.
- Confirm **Allow Notifications** is enabled in both PICR app settings and the device's operating-system settings.
- Use a physical device; simulators do not register for push.
- Confirm the public link is enabled and the test is outside its 30-minute view-notification window.
- Confirm `DISABLE_ACCESS_LOGS` is not enabled on the server.
- Check that the app and PICR server are current and that the device can reach the server URL used at login.
