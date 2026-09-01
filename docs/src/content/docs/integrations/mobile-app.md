---
title: PICR mobile app
description: Receive link-open notifications and browse your PICR server from iOS or Android.
---

The PICR mobile app is a companion for signed-in PICR users. Its main purpose is to deliver push notifications when recipients open public links, with convenient access back to the relevant gallery.

Public-link recipients continue to use the web gallery. Public links cannot be used to sign in to or browse through the mobile app.

## Install the app

- [Download PICR Client for iPhone or iPad](https://apps.apple.com/us/app/picr-client/id6748066012)
- [Download PICR Client for Android](https://play.google.com/store/apps/details?id=com.isaacinsoll.picr)

The app connects to your own PICR server; it is not a hosted PICR account.

## Prepare an account

The app currently requires:

- An enabled PICR administrator account
- A username formatted as an email address
- A password of at least eight characters
- The full URL of a reachable PICR server

:::caution[Change the default username before mobile sign-in]
The first installation account defaults to the username `admin`, which the mobile login form does not accept as an email address. Change it to an email-address username under **Settings → Admin Users** before signing into the app.
:::

The account's home folder controls which galleries and events it can access. Use a root-scoped account for the whole library or a narrower account for a particular photographer or business area.

## Sign in

Enter:

- **Server** — for example `https://clients.example.com/`, including HTTPS and any required path
- **Username** — the account's email-address username
- **Password** — the same password used for the PICR web interface

The app stores the server details and authentication credentials on the device so it can reconnect to that server.

:::tip[Use a reachable HTTPS address]
Use a publicly trusted HTTPS certificate. The device must be able to reach the server directly; a URL that only resolves inside another private network will not work while the phone is elsewhere.
:::

## Enable link-open notifications

1. Sign in to the app on a physical device.
2. Open **Settings**.
3. Allow notifications when the operating system asks.
4. Enable **Allow Notifications** in the app.
5. Open one of your public links in a private browser after the notification throttle window, or ask another person to open it.

The PICR server registers an Expo push token for that device. When an eligible event occurs, the server sends the notification through Expo's push service. Tapping an alert deep-links to the related administrator folder or file.

The app can also notify about folder downloads and file feedback. See [Access logs and notifications](/PICR/sharing/notifications/) for event and throttling details.

## Browse and manage galleries

The app provides a compact signed-in view of your server, including:

- Dashboard activity and recently modified galleries
- Gallery and file search
- List, feed, two-column grid, and three-column grid views
- Photo and video viewing
- File metadata and comments
- Original-media download to the device when permitted
- Image cache management

The web administrator interface remains the complete place to create public links, manage accounts, configure branding, and change server settings.

## Device settings

The app's **Settings** screen shows the connected server and version, the app version, notification control, image-cache control, and logout action.

Use **Clear image cache** when previews appear stale or device storage needs to be reclaimed. Logging out removes the current signed-in session from the app; it does not disable the PICR account on the server.

## Privacy and push delivery

Gallery and account data comes from your self-hosted PICR server. For push notifications, the app obtains an Expo push token, stores it on your PICR server, and the server sends notification payloads through Expo's service for delivery to Apple or Google notification infrastructure.

Review the [mobile app privacy policy](/PICR/reference/privacy-policy/) for the current data-flow summary.
