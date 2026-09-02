---
title: Mobile app privacy policy
description: Understand what the PICR mobile app stores and how self-hosted galleries and push notifications are delivered.
---

Effective date: 1 September 2026

This privacy policy applies to the PICR mobile application for iOS and Android, provided by Isaac Insoll (the **Application**). PICR is a self-hosted product: the Application connects to a PICR server chosen and operated by the user or their organisation.

## Information the Application uses

To sign in and communicate with a chosen PICR server, the Application stores:

- Server URL
- PICR username
- PICR password
- Authentication token returned by that server

These values are stored locally using the operating system's secure credential storage through Expo SecureStore. Expo describes SecureStore as encrypted local key-value storage intended for values such as tokens and secrets. See the [Expo SecureStore documentation](https://docs.expo.dev/versions/latest/sdk/securestore/).

The Application requests gallery, account, media, comment, and server information directly from the chosen PICR server. The operator of that server controls its storage, network, access logs, retention, and other privacy practices.

## Images and cached data

The Application caches gallery images on the device to improve browsing performance. Signed-in users can clear this image cache from the Application's **Settings** screen.

When a user chooses to download media, the Application may request access to the device's photo or media library and save the selected file there. The operating system controls that permission, and it can be changed in device settings.

The Application does not request or use precise location data.

## Push notifications and third-party delivery

Push notifications are optional. When notification permission is granted, the Application obtains an Expo push token. If the user enables **Allow Notifications**, the token and device name are registered with their chosen PICR server.

For an eligible event, that self-hosted server sends a notification through the Expo Push Service. The payload can contain:

- PICR recipient or account name associated with the event
- Event type, such as viewed, downloaded, commented, rated, or flagged
- Folder or filename
- Administrator deep link to the related folder or file
- Optional media-preview URL

Expo then routes the notification through Google Firebase Cloud Messaging for Android or Apple Push Notification service for iOS. Expo's documentation describes this delivery chain and the use of an Expo push token: [Send notifications with the Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/).

Notification content therefore passes through Expo and the relevant Apple or Google push infrastructure. Avoid putting information in PICR recipient names, filenames, folder names, or comments that would be inappropriate to expose in a device notification.

Users can turn off **Allow Notifications** in the Application and can revoke notification permission in operating-system settings. Turning off **Allow Notifications** marks that device record as disabled on the PICR server. The server operator controls retention or deletion of server-side device records.

## Other third parties

The Application is distributed through Apple App Store and Google Play, whose own account, download, diagnostic, and store policies may apply independently.

PICR does not provide a hosted gallery account for the Application. Normal gallery data is requested from the self-hosted server selected by the user rather than an Isaac Insoll-operated PICR cloud service.

## Data retention and deletion

- Logging out removes the saved PICR login from the Application's secure local storage.
- **Clear image cache** removes cached gallery previews managed by the Application.
- Uninstalling the Application removes its locally managed application data according to the device platform's behaviour.
- Data stored by the selected PICR server—including accounts, registered devices, access logs, comments, and gallery state—must be managed by that server's operator.

## Security

Use a PICR server with a publicly trusted HTTPS certificate. HTTPS protects credentials, tokens, gallery data, and media while travelling between the device and server.

No system can guarantee absolute security. Users and server operators are responsible for protecting device access, PICR credentials, backups, server updates, and network configuration.

## Children

The Application is not directed at children under 13 and is not knowingly used to solicit personal information from them. A parent or guardian who believes a child has supplied personal information through a PICR deployment should contact that deployment's operator and may also use the contact method below.

## Changes to this policy

This policy may be updated when the Application's behaviour or service providers change. The current version and effective date are published on this page. Continued use after an update constitutes acceptance where permitted by applicable law.

## Contact

For questions about the Application or this policy, open an issue in the [PICR GitHub repository](https://github.com/IsaacInsoll/PICR/issues).

For data held by a particular self-hosted PICR server, contact the person or organisation operating that server.
