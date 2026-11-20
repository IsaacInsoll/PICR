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

The app requires an enabled PICR administrator account and a reachable server running a version that supports browser-based app sign-in. Update the server and mobile app together; older app versions cannot sign in after the server upgrade. Usernames such as `admin` are supported; an email-address username is not required.

The account's home folder controls which galleries and events it can access. Use a root-scoped account for the whole library or a narrower account for a particular photographer or business area.

## Sign in

1. Enter your **PICR server** address, for example `https://clients.example.com/`, including any required path.
2. Choose **Continue in browser**. Sign in on your server’s website with your usual username and password. You can use your browser’s password manager.
3. If prompted, enter your authenticator code or a single-use recovery code. If the server requires 2FA and you have not enrolled, complete setup and save your recovery codes first.
4. After signing in, you return to the app automatically. If your browser was already signed in, check the displayed account and choose **Continue as …**, or choose **Use a different account**. The server address appears above the continue button.

The app stores session tokens in the device’s secure credential storage. Your password is entered on the website and is not saved by the app. The app and browser have separate sessions, so signing out of one does not sign out the other.

Using the app while connected to your server within each **28-day window** keeps its session renewable. After 28 days without active renewal, sign in again. Account security changes can also require a fresh sign-in. Temporary connection failures preserve your saved session and let you retry.

After upgrading from an older app, sign in once using this flow. Your server address is retained and the previously saved password is removed. If you cancel browser sign-in, you can try again from the app.

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
