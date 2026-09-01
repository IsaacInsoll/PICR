---
title: Languages
description: See which languages PICR supports and which parts of the product are translated.
---

PICR's web interface supports:

- 🇺🇸 English
- 🇫🇷 French / Français
- 🇩🇪 German / Deutsch
- 🇬🇷 Greek / Ελληνικά
- 🇪🇸 Spanish / Español
- 🇺🇦 Ukrainian / Українська

PICR selects a supported language from the browser's preferences and falls back to English. The normal signed-in and gallery interfaces do not currently expose a persistent language selector, so browser preference is the primary customer control.

Regional browser settings are preserved for dates and numbers where possible. For example, a browser can use the English catalog while retaining Australian date formatting, or use German text with Swiss regional formatting.

## What is translated

The web catalogs cover:

- Public galleries, passcodes, downloads, and review controls
- Login, dashboard, folders, users, links, branding, and server settings
- Shared actions, dates, status messages, and errors

PICR translates its own interface, not customer-authored or recorded content. These remain exactly as entered or detected:

- Folder and filenames
- Gallery titles, subtitles, and branding text
- Recipient names and comments
- Access-log device information
- Machine-readable CSV values

The mobile app and server-sent push/ntfy notification text are currently English-only.

## Request a language or suggest a correction

To request another language or share a translation suggestion or correction, leave a comment on [language requests and translation feedback](https://github.com/IsaacInsoll/PICR/issues/84). Include the language and the wording you would like added or changed. You do not need to edit the translation files yourself.
