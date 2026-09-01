---
title: Configuration reference
description: Configure PICR's Docker environment for storage, scanning, security, logging, media, and integrations.
---

PICR reads environment variables when the server starts. In Docker Compose, place them under the `picr` service's `environment` section and recreate the container after a change.

The [installation guide](/PICR/getting-started/install/) contains a complete starting Compose file. This page explains customer-relevant overrides; the repository [.env.example](https://github.com/IsaacInsoll/PICR/blob/master/.env.example) remains the exhaustive source.

## Required settings

| Variable       | Purpose                                                                            |
| -------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL URL, for example `postgres://picr:password@db/picr`                     |
| `BASE_URL`     | Public PICR URL used in links and notifications; must be a valid URL ending in `/` |

`BASE_URL` should be the HTTPS address recipients actually use, including any path prefix. It does not control which hostnames the HTTP server listens on.

## First administrator

| Variable         | Default                   | Purpose                                                                 |
| ---------------- | ------------------------- | ----------------------------------------------------------------------- |
| `ADMIN_USERNAME` | `admin`                   | Username used only when creating the first account on an empty database |
| `ADMIN_PASSWORD` | Generated and logged once | First password; if supplied, must contain at least eight characters     |

These settings do not overwrite an existing account. Manage current credentials under **Settings → Admin Users**.

Use an email address for `ADMIN_USERNAME` if the first account needs mobile-app access.

## Scanning and filesystem changes

| Variable               | Default  | Values and purpose                                  |
| ---------------------- | -------- | --------------------------------------------------- |
| `FILE_WATCHER`         | `native` | `native`, `polling`, or `off`                       |
| `POLLING_SECONDS`      | `20`     | Positive polling interval used only in polling mode |
| `ON_VIEW_SCAN`         | `off`    | `off`, `direct`, `direct_and_new`, or `one_level`   |
| `SCHEDULED_SCAN_HOURS` | `0`      | Whole-library scan interval; `0` disables it        |
| `PICR_PING_TOKEN`      | unset    | Enables PICR Ping endpoint; minimum 64 characters   |

See [Scan your media library](/PICR/operations/scanning/) before combining modes. `USE_POLLING` and `POLLING_INTERVAL` remain temporary compatibility aliases for older installations; prefer the current names.

## Media tools and performance

| Variable             | Default                     | Purpose                                           |
| -------------------- | --------------------------- | ------------------------------------------------- |
| `FFMPEG_PATH`        | `ffmpeg` from `PATH`        | Override FFmpeg executable                        |
| `FFPROBE_PATH`       | `ffprobe` from `PATH`       | Override FFprobe executable                       |
| `EXIFTOOL_PATH`      | `exiftool` from `PATH`      | Override RAW preview/metadata helper              |
| `MAGICK_PATH`        | `magick` from `PATH`        | Override PSD, PSB, HEIC, and HEIF decoder         |
| `THUMBNAIL_WORKERS`  | CPU/memory-aware, maximum 8 | Parallel thumbnail worker count                   |
| `UV_THREADPOOL_SIZE` | `8` in Docker image         | Native async worker pool used by image processing |

The official Docker image supplies the media tools. Overrides are mainly for custom installations or troubleshooting.

Thumbnail JPEG quality and use-of-originals settings are stored in PostgreSQL and edited under **Settings → Media**, not through environment variables. See [Media and thumbnails](/PICR/operations/media-and-thumbnails/).

## Optional write access

| Variable    | Default | Purpose                                                              |
| ----------- | ------- | -------------------------------------------------------------------- |
| `CAN_WRITE` | `false` | Requests media rename/move support after a real write probe succeeds |

This variable alone is insufficient. The Docker media mount must also be read-write and the container user must have filesystem permission. Read [Enable rename and move access](/PICR/operations/write-access/) before changing it.

## Access logs

| Variable              | Default | Purpose                                                          |
| --------------------- | ------- | ---------------------------------------------------------------- |
| `DISABLE_ACCESS_LOGS` | `false` | Stops new public-link view/download logs and their notifications |

Existing rows are retained. Feedback notifications for comments, ratings, and flags use a different path and continue.

## Login protection

| Variable                                | Default | Purpose                                   |
| --------------------------------------- | ------: | ----------------------------------------- |
| `LOGIN_RATE_LIMIT_ENABLED`              |  `true` | Enables login brute-force protection      |
| `LOGIN_RATE_LIMIT_WINDOW_MINUTES`       |    `15` | Attempt-counting window                   |
| `LOGIN_RATE_LIMIT_IP_MAX_ATTEMPTS`      |    `30` | Maximum attempts per IP in the window     |
| `LOGIN_RATE_LIMIT_USER_IP_MAX_ATTEMPTS` |     `5` | Maximum attempts for one username/IP pair |
| `LOGIN_RATE_LIMIT_BLOCK_MINUTES`        |    `15` | Initial temporary block                   |
| `LOGIN_RATE_LIMIT_MAX_BLOCK_MINUTES`    |    `60` | Maximum escalating block                  |

The defaults are appropriate for most installations. If a trusted reverse proxy is involved, ensure it forwards client addressing correctly before interpreting rate-limit or access-log IP values.

## Token secrets

| Variable          | Default                            | Purpose                                                     |
| ----------------- | ---------------------------------- | ----------------------------------------------------------- |
| `TOKEN_SECRET`    | Generated and stored in PostgreSQL | Optional explicit JWT signing secret; minimum 64 characters |
| `PICR_PING_TOKEN` | unset                              | Shared Ping infrastructure secret; minimum 64 characters    |

New installations do not need `TOKEN_SECRET` in Compose. PICR creates one on first boot and retains it in the database.

Generate a Ping token with:

```bash
openssl rand -hex 32
```

Do not put either secret in a URL or public repository.

## Logging and diagnostics

| Variable          | Default | Purpose                                                 |
| ----------------- | ------- | ------------------------------------------------------- |
| `CONSOLE_LOGGING` | `false` | Also writes application logs to the container console   |
| `DEBUG_SQL`       | `false` | Logs verbose database queries for short-lived diagnosis |

PICR normally writes `info.log` and `error.log` under the cache location. Enable SQL logging only while investigating a specific issue; it is noisy and may expose operational detail.

## Server and video settings

| Variable                    | Default               | Purpose                                     |
| --------------------------- | --------------------- | ------------------------------------------- |
| `PORT`                      | `6900`                | Internal HTTP listen port                   |
| `VIDEO_ACCELERATION`        | `auto`                | `auto` detects VAAPI; `off` forces CPU mode |
| `VIDEO_ACCELERATION_DEVICE` | `/dev/dri/renderD128` | Render device when more than one exists     |

VAAPI also requires a passed-through `/dev/dri` device and render-group permission. It currently affects capability reporting and the benchmark rather than normal thumbnail generation.

## Apply and verify changes

After editing Compose:

```bash
docker compose up -d picr
docker compose logs --tail=100 picr
```

Open **Settings → Server Info** to confirm scanning modes, media capabilities, write access, Ping status, and other resolved runtime information.
