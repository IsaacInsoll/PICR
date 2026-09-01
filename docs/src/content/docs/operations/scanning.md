---
title: Scan your media library
description: Choose how PICR detects additions, changes, moves, and deletions on local or network storage.
---

PICR reads an ordinary filesystem, so it needs a strategy for noticing when that filesystem changes. The right choice depends on where the media lives and whether low latency, low I/O, or NAS disk spin-down matters most.

## Choose a strategy

| Storage and priority                                       | Recommended starting point                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| Media is local to the PICR Docker host                     | `FILE_WATCHER=native`                                                 |
| Docker or a network mount does not deliver reliable events | `FILE_WATCHER=polling`                                                |
| Media lives on another NAS and real-time updates matter    | [PICR Ping](/PICR/operations/picr-ping/) with a scheduled safety scan |
| NAS disks should sleep between active jobs                 | Watcher off, on-view scanning, and a scheduled safety scan            |
| You only change the library occasionally                   | Watcher off and manual **Scan Now**                                   |

Start with one primary real-time method. Add a scheduled scan as a backstop when missing an event would matter.

## Native watching

```yaml
environment:
  FILE_WATCHER: native
```

Native mode uses operating-system filesystem events. It is efficient and responsive when PICR sees the same local filesystem that receives the changes.

Events do not always cross SMB, NFS, Docker, virtualisation, or NAS boundaries reliably. If files only appear after a restart or manual scan, use polling or Ping.

## Polling

```yaml
environment:
  FILE_WATCHER: polling
  POLLING_SECONDS: '20'
```

Polling asks the watcher to check for filesystem changes at an interval. It is a dependable default for many Docker and NAS mounts.

A shorter interval finds changes sooner but creates more filesystem activity. A longer interval reduces I/O but delays detection. Start with 20 seconds and change it only when the trade-off is visible in your environment.

## Watcher off

```yaml
environment:
  FILE_WATCHER: 'off'
```

PICR performs a whole-library scan at boot, then relies on manual, on-view, scheduled, or Ping-triggered scans. This can be useful for infrequently changed libraries and NAS devices that should not be continuously touched.

## On-view scanning

`ON_VIEW_SCAN` refreshes a folder in the background when somebody opens it. Repeated requests for the same folder are cooled down for one minute.

| Mode             | Behaviour                                                                  |
| ---------------- | -------------------------------------------------------------------------- |
| `off`            | No scan caused by viewing a folder                                         |
| `direct`         | Scan files and folders directly inside the viewed folder                   |
| `direct_and_new` | Scan the viewed folder and descend into newly discovered direct subfolders |
| `one_level`      | Scan the viewed folder and every existing direct subfolder                 |

The root/Home folder always uses a direct-only scan so opening Home does not unexpectedly walk the entire library.

A useful low-I/O setup is:

```yaml
environment:
  FILE_WATCHER: 'off'
  ON_VIEW_SCAN: direct_and_new
  SCHEDULED_SCAN_HOURS: '24'
```

The page is served from PICR's current database immediately; scanning continues in the background and the gallery refreshes when results arrive.

## Scheduled scans

`SCHEDULED_SCAN_HOURS` runs a whole-library reconciliation at that interval:

```yaml
environment:
  SCHEDULED_SCAN_HOURS: '24'
```

Use scheduled scans as a safety net for missed events, Ping outages, or folders that nobody opened. `0` disables the schedule.

PICR queues thumbnails automatically when a scheduled scan discovers a manageable batch. Very large imports are indexed without queueing every thumbnail at once; previews are then generated as needed or through **Generate Thumbnails**.

## Manual scans and thumbnails

From a folder's menu, choose **Manage → Folder**:

- **Scan Now** reconciles that folder tree with the filesystem.
- **Generate Thumbnails** queues previews for the folder.

Use a manual scan after correcting a mount, moving a large delivery, or confirming that an automated strategy is configured correctly.

## PICR Ping

PICR Ping runs beside media on a separate NAS and sends authenticated directory hints to the PICR server. PICR still resolves and verifies every path through its own read-only mount.

Ping avoids continuously polling the whole remote library while retaining near-real-time detection. Pair it with a scheduled scan because its hints are not a durable event log. See the [PICR Ping setup guide](/PICR/operations/picr-ping/).

## Monitor scanning

Open **Settings → Server Info** to check:

- Watcher and on-view modes
- Scheduled scan timing and latest result
- PICR Ping sources, heartbeats, and errors
- Whether the filesystem exposes stable inode identity
- Current media-processing activity

Server and Ping logs provide the detailed path or delivery error when something fails.

## Moves, renames, and review history

PICR tries to retain file and folder identity across moves and renames. Same-filesystem inode identity is the strongest signal; unique file signatures can also help in some cases.

On filesystems without stable identity, a move may look like removal followed by addition. The media reappears, but database-linked public links, branding, comments, ratings, or flags may not follow it.

For important reviewed galleries, use PICR's optional [rename and move support](/PICR/operations/write-access/) or keep the path stable.

## Changes require a restart

Scanning environment variables are read when PICR starts. After editing Compose, recreate the application container:

```bash
docker compose up -d picr
```

Then check **Server Info** to confirm PICR resolved the expected modes.
