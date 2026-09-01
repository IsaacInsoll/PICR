---
title: PICR Ping
description: Detect media changes in real time when PICR reads a library from a separate NAS.
---

PICR Ping provides realtime media detection when your library lives on a NAS
and PICR runs elsewhere. It is a small, read-only watcher that runs beside the
media and tells PICR which directories may have changed.

Run the current `latest` PICR and PICR Ping images together. Ping releases are
published only after the matching PICR backend support is available; any future
exception will be called out in the release documentation.

## When to use it

Use Ping when:

- PICR reads media through SMB, NFS, or another network mount;
- native filesystem events do not cross that mount reliably;
- polling the entire library keeps NAS drives awake or creates excessive I/O;
- you want exports and transfers to appear without waiting for a scheduled scan.

You normally do not need Ping when PICR and the media are on the same machine.
In that case, `FILE_WATCHER=native` is simpler and already provides realtime
detection.

## How it works

Ping sends directory paths as hints. It does not send remote file statistics or
tell PICR to replay raw Chokidar events:

```text
NAS filesystem → PICR Ping → authenticated directory hints → PICR scanner
                                                       ├→ metadata/database
                                                       └→ thumbnail queue

Scheduled scan ─────────────────────────────────────────→ safety-net reconcile
```

PICR resolves and stats every path through its own media mount, applies its
normal settling rules, and handles additions, changes, moves, and deletions.
This keeps the NAS watcher from becoming an authoritative source of filesystem
state.

Pings are realtime hints, not a durable event log. Keep a scheduled scan as a
safety net for outages and configuration mistakes. The recommended pairing is:

```yaml
FILE_WATCHER: 'off'
ON_VIEW_SCAN: 'off'
SCHEDULED_SCAN_HOURS: '12'
```

Ping can run alongside `FILE_WATCHER=native` or `polling` while you test it, but
`off` avoids duplicate continuous monitoring once Ping is trusted.

## Setup overview

The intended deployment uses two Docker hosts:

1. The PICR host mounts the NAS media for reading and runs PICR plus Postgres.
2. The NAS runs Ping against the original local filesystem.

A single Compose file cannot deploy services to two independent Docker hosts,
so the examples below are two complete Compose projects. Put the same token in
each project's `.env` file.

### 1. Generate the shared token

Generate 32 random bytes as 64 hexadecimal characters:

```bash
openssl rand -hex 32
```

Create a `.env` file on both hosts:

```dotenv
PICR_PING_TOKEN=replace-with-the-64-character-value
```

Treat this as an infrastructure secret. Do not put it in a URL, commit it, or
reuse it as a general PICR API key.

### 2. Configure the PICR host

This is a complete PICR/Postgres example. Replace the media path, cache path,
public URL, and database password for your installation.

```yaml
services:
  picr:
    image: isaacinsoll/picr
    container_name: picr
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - '6900:6900'
    volumes:
      - /mnt/nas/photos:/home/node/app/media:ro
      - ./cache:/home/node/app/cache
    environment:
      BASE_URL: https://clients.example.com/
      DATABASE_URL: postgres://picr:replace-this-password@db/picr
      FILE_WATCHER: 'off'
      ON_VIEW_SCAN: 'off'
      SCHEDULED_SCAN_HOURS: '12'
      PICR_PING_TOKEN: ${PICR_PING_TOKEN}

  db:
    image: postgres:17
    container_name: picr-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: picr
      POSTGRES_PASSWORD: replace-this-password
      POSTGRES_DB: picr
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U picr -d picr']
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 5s
    volumes:
      - ./data:/var/lib/postgresql/data
```

If `PICR_PING_TOKEN` is unset or empty, PICR does not register the inbound Ping
route. Requests receive `404`, which makes accidental exposure opt-in.

### 3. Validate Ping on the NAS in dry-run mode

Start with `DRY_RUN=true`. Dry run does not require a URL or token, makes no
outbound requests, and logs every directory hint after path mapping.

```yaml
services:
  picr-ping:
    image: isaacinsoll/picr-ping:latest
    container_name: picr-ping
    restart: unless-stopped
    user: '1000:1000' # use a numeric UID:GID with read access to the media
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    volumes:
      - /volume1/photos:/media:ro
    environment:
      DRY_RUN: 'true'
      VERBOSE: 'true'
      WATCH_ROOT: /media
      WATCH_MODE: native
      PATH_PREFIX: ''
      PICR_PING_NAME: studio-nas
```

The image already runs as the non-root `node` user. The explicit `user` line
makes the numeric identity visible and adjustable for NAS permissions. Ping
needs only read access: both the media mount and the container root filesystem
remain read-only, and no Linux capabilities are required.
The image also supplies its own healthcheck, including the five-minute startup
period needed for large media libraries.

Start the project and follow its logs. The ready line reports exactly how many
directories and entries Chokidar is watching:

```text
✔ Watching 697 directories · 74,631 entries
```

Create, modify, rename, and delete a test file through your normal workflow.
Dry-run logs should contain media-root-relative directories such as
`Weddings/Smith`, never host paths such as `/volume1/photos/Weddings/Smith`.

Ping deliberately ignores dotfiles and dot-directories, Synology `@eaDir`,
`desktop.ini`, and `Thumbs.db`.

### 4. Enable delivery

After dry-run paths look correct, change the Ping environment to:

```yaml
environment:
  DRY_RUN: 'false'
  PICR_URL: http://192.168.1.50:6900/
  PICR_PING_TOKEN: ${PICR_PING_TOKEN}
  PICR_PING_NAME: studio-nas
  WATCH_ROOT: /media
  PATH_PREFIX: ''
  WATCH_MODE: native
  RECONCILE_ON_START: auto
```

Plain HTTP is appropriate when the containers communicate over a trusted,
isolated network. Use HTTPS when that network is shared or untrusted. Tokens are
sent in the `Authorization` header, not in query strings.

On startup, Ping samples one visible file and asks PICR to verify its mapped
path without starting a scan. Look for a log like:

```text
✅ Path mapping verified: Weddings/Smith/IMG_001.CR3
```

An empty library is valid; Ping simply skips this probe.

## Path mapping and multiple NAS devices

`WATCH_ROOT` is a local container path. `PATH_PREFIX` locates that watched tree
inside PICR's media root.

| PICR sees the Ping root at | `WATCH_ROOT` | `PATH_PREFIX`    |
| -------------------------- | ------------ | ---------------- |
| its media root             | `/media`     | empty            |
| `Archive/Studio`           | `/media`     | `Archive/Studio` |

Paths are relative, use forward slashes, and are case-sensitive. Do not add a
leading or trailing slash. For example, a file at
`/media/Weddings/Smith/IMG_001.CR3` with `PATH_PREFIX=Archive/Studio` is reported
as `Archive/Studio/Weddings/Smith`.

Use one Ping container per watch root. Give each one a stable, descriptive
`PICR_PING_NAME` and a distinct prefix. PICR retains independent heartbeat and
reconcile status for each source.

## Configuration reference

| Variable                | Default  | Meaning                                                                     |
| ----------------------- | -------- | --------------------------------------------------------------------------- |
| `PICR_URL`              | —        | PICR base URL; required unless `DRY_RUN=true`                               |
| `PICR_PING_TOKEN`       | —        | Shared secret, at least 64 characters; required unless dry-run              |
| `PICR_PING_NAME`        | —        | Stable source name; required unless dry-run, at most 64 characters          |
| `WATCH_ROOT`            | `/media` | Directory watched inside the Ping container                                 |
| `PATH_PREFIX`           | empty    | Watched tree's media-root-relative location in PICR                         |
| `WATCH_MODE`            | `native` | `native` for local/bind-mounted media; `polling` when events are unreliable |
| `POLL_INTERVAL_SECONDS` | `20`     | Polling interval when `WATCH_MODE=polling`                                  |
| `DRY_RUN`               | `false`  | Log mapped hints without contacting PICR                                    |
| `VERBOSE`               | `false`  | Log every detected event; dry run is always verbose                         |
| `BATCH_SECONDS`         | `1`      | Maximum normal batching interval                                            |
| `STABILITY_SECONDS`     | `2`      | Chokidar write-stability window                                             |
| `RECONCILE_ON_START`    | `auto`   | `auto`, `true`, or `false` startup reconciliation                           |
| `PING_HEALTH_PORT`      | `6901`   | Loopback-only health server port inside the container                       |

The defaults are intentional. Avoid tuning batching or stability until real
logs demonstrate a problem.

## What to expect

With the defaults and no import backlog, approximate detection-and-settling
times are:

| Scenario                           | Indexed by PICR                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| 500-file export at one file/second | first file about 13 seconds; each file 12–24 seconds after landing; complete about 8m32s |
| 10 GB transfer at 100 MB/s         | about 12–14 seconds after the copy finishes                                              |
| Same-folder rename                 | about 2–4 seconds; identity normally preserved                                           |
| Cross-folder move or folder rename | about 2–4 seconds with stable inodes; otherwise 12–24 seconds as remove + add            |

An already-open gallery may take up to another 20 seconds to refresh. Metadata
and video poster generation can extend these estimates when the server has a
large import backlog.

Same-folder signature matching can preserve a rename without inodes when the
match is unique. Cross-folder and folder-rename identity depends on stable
inodes. On filesystems without them, the media reappears but comments, flags,
ratings, or other row-linked state may not follow the move.

## Reliability behavior

- Ping batches and deduplicates hints by directory. A 500-file export to one
  folder normally sends one directory per batch, not 500 file events.
- Deletion-derived hints wait behind the write-stability window. A move's
  destination and source may share one batch; if the destination has already
  flushed, it reaches PICR first so move identity can still be claimed safely.
- Temporary network errors, timeouts, `408`, `429`, and server errors retry with
  capped exponential backoff.
- Invalid payloads, a wrong token, a disabled endpoint, and an incompatible
  protocol are permanent errors. Ping logs the failure and `/readyz` returns
  `503`.
- The normal directory retry buffer is in memory. If delivery is exhausted or
  the buffer overflows, Ping retains and retries one scoped reconcile marker.
  New hints received while that marker is backing off widen it as needed and
  make it a forced reconcile so no discarded precise hint can be skipped.
- Ping sends a heartbeat every minute. PICR marks a source stale after roughly
  three missed heartbeats.
- On a normal container shutdown, any deletion hints still inside the move-safety
  hold become one forced reconcile of the configured watch prefix. This avoids
  losing them without scanning a move's source before its destination.
- `RECONCILE_ON_START=auto` repairs the `ignoreInitial` startup gap while avoiding
  a redundant covering scan when PICR can prove one already covered it.
- The 12-hour scheduled scan remains the durable backstop.

## Health and logs

Ping exposes loopback-only endpoints inside its container:

- `/healthz` returns `200` while the process can answer HTTP.
- `/readyz` returns `200` only after the watcher is ready and delivery has no
  permanent error.

Docker uses `/readyz` for container health. PICR's **Server Info** page shows
connected, stale, never-seen, degraded, and error states for every Ping source.

The startup banner states the version, source, target, watch mode, and logging
mode. Default logging reports batches and a one-minute activity summary;
`VERBOSE=true` additionally reports each detected filesystem event.

## Synology Container Manager

Container Manager can run the NAS Compose project above without a shell:

1. Create a project and paste or upload the Ping Compose file.
2. Add the media directory as `/media` and select **Read-only**.
3. Add the `.env` values through the project or environment-variable UI.
4. Deploy `isaacinsoll/picr-ping:latest`.
5. Inspect the container log until the watcher reports ready.

Build the image in CI and pull it on the NAS. Building Node dependencies on the
NAS is slower, creates unnecessary I/O, and does not test the published
multi-architecture artifact.

Do not restart Ping merely because startup takes time. `ignoreInitial=true`
suppresses initial events, but Chokidar must still walk the tree to establish
watches. That walk reads directory metadata, spins sleeping drives up, and may
take several minutes for a large library. The Docker healthcheck therefore has
a five-minute startup period.

## Troubleshooting

### `PICR cannot see ...; check the media mount and PATH_PREFIX`

Ping found a real NAS file, but PICR could not resolve the resulting path.
Compare both containers' views of the same file and correct `PATH_PREFIX`. The
prefix describes the location inside PICR's media root, not a host filesystem
path.

### PICR returns `404`

The PICR-side `PICR_PING_TOKEN` is unset or empty, the PICR version predates Ping
support, or `PICR_URL` targets the wrong service. The integration route is
intentionally absent when Ping is disabled.

### PICR returns `401`

The endpoint exists but the two containers have different tokens. Replace both
values from the same 64-character secret and restart both containers. Do not
paste the token into logs or URLs.

### `ENOSPC` or `EMFILE` while establishing watches

This usually means a host inotify limit, not a full disk. Check both limits on
the NAS host:

```bash
sysctl fs.inotify.max_user_watches fs.inotify.max_user_instances
```

Increase both values according to the NAS vendor's supported persistence
method. On Synology, a boot-up task is commonly needed to reapply sysctl values
after restart. Changing values inside the container does not raise the host
limits.

### Native mode misses events

`WATCH_MODE=native` is intended for a local NAS filesystem exposed through a
Docker bind mount. If `WATCH_ROOT` is itself SMB/NFS-mounted on the Ping host,
try `WATCH_MODE=polling`. Polling increases metadata I/O and is a fallback, not
the preferred NAS-side deployment.

### Changes made while Ping was stopped are missing

Ping does not replay an initial event stream. Its startup reconcile normally
repairs this, and the scheduled scan catches anything still missed. Confirm
`RECONCILE_ON_START` was not set to `false` and keep
`SCHEDULED_SCAN_HOURS` enabled.

### Symlinks expose unexpected media

PICR and Ping both follow symlinked directories for consistent behavior. A
symlink inside the media root can therefore expose readable content physically
outside it. Remove the symlink or adjust host permissions if that is not
intended. The Ping mount remains read-only, but read-only does not prevent
content from being indexed or shared.
