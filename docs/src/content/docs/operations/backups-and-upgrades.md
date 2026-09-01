---
title: Backups and upgrades
description: Back up PICR's media and PostgreSQL state, upgrade safely, and understand compatibility limits.
---

:::danger[A media backup alone cannot restore PICR]
A complete PICR recovery needs both the original media library and the PostgreSQL database. The thumbnail cache alone is never a backup.
:::

## What to protect

| Data                             | What it contains                                                                          | Required for recovery? |
| -------------------------------- | ----------------------------------------------------------------------------------------- | :--------------------: |
| Media library                    | Original photos, videos, folder hierarchy, and supporting files                           |          Yes           |
| PostgreSQL database              | Accounts, public links, branding, comments, ratings, flags, access logs, and server state |          Yes           |
| Compose and secret configuration | Mounts, public URL, database credentials, and optional integration secrets                |          Yes           |
| Cache                            | Thumbnails and generated ZIP files                                                        |           No           |

Back up the media and database on a schedule that matches how quickly client review data changes—not only when media is imported.

## Back up PostgreSQL while PICR is running

For the installation guide's `db` service, create a logical SQL backup with `pg_dump`:

```bash title="Create a dated PostgreSQL backup"
mkdir -p backups
docker compose exec -T db pg_dump -U picr -d picr > backups/picr-$(date +%Y-%m-%d).sql
```

The command writes the dump on the Docker host. Store it somewhere independent of the server along with your media and Compose configuration.

:::caution[Do not copy a live PostgreSQL data directory]
`pg_dump` is safer than copying PostgreSQL's live data directory. A raw filesystem copy is valid only when PostgreSQL is fully stopped or when it is taken by a storage snapshot system designed to preserve database consistency.
:::

If your database service, user, or database name differs from the installation example, adjust the command.

## Test restoration

A backup is only useful if it restores. Periodically test a dump against a disposable, empty PostgreSQL database and start a matching PICR version against it.

The basic restore command for an empty database is:

```bash title="Restore into an empty PostgreSQL database"
docker compose exec -T db psql -U picr -d picr < backups/picr-2026-09-01.sql
```

Do not restore a full dump over an active production database with existing PICR tables. Stop PICR, prepare an empty target database, restore, then start the compatible PICR version and inspect its migration logs.

Also verify that the restored database points at a media library with the same folder structure. Database rows cannot recreate missing originals.

## Back up configuration

Keep recoverable copies of:

- `compose.yml`
- Any Compose `.env` file
- Reverse-proxy configuration and certificates, where appropriate
- The PICR Ping token and NAS Compose project if Ping is used
- Custom UID/GID or mount configuration needed for media and cache permissions

:::caution[Protect configuration backups]
These files may contain passwords and notification tokens. Store them in a protected backup, not a public source repository.
:::

## Before every PICR upgrade

1. Read the [release notes](https://github.com/IsaacInsoll/PICR/releases).
2. Create and retain a fresh PostgreSQL dump.
3. Confirm the media backup is current.
4. Record the running PICR and PostgreSQL versions.
5. Pull and recreate PICR:

   ```bash title="Upgrade the PICR container"
   docker compose pull picr
   docker compose up -d picr
   docker compose logs -f picr
   ```

6. Confirm login, gallery access, background migrations, thumbnails, and a test public link.

PICR applies application database migrations during startup. Do not interrupt the container merely because the first upgraded boot takes longer than normal; follow the logs and investigate an actual error.

## PICR compatibility policy

PICR supports a direct upgrade from any release in the previous major version to any release in the next major version unless release notes explicitly declare a required stop.

Examples:

- Any `0.x` release can upgrade directly to any `1.x` release.
- Any `1.x` release can upgrade directly to any `2.x` release.

The database records a minimum compatible PICR version when a migration makes older application versions unsafe. Downgrading below that floor requires restoring a database backup taken before the upgrade.

## PostgreSQL major upgrades

Changing `postgres:17` to another PostgreSQL major version is not a normal PICR image update. PostgreSQL data directories are major-version specific and need their own supported migration process, commonly a logical dump/restore or `pg_upgrade` workflow.

:::danger[Do not casually change the PostgreSQL major version]
Do not change the database image major merely because a newer tag exists. Follow PICR release guidance and PostgreSQL's migration requirements, and retain the old database backup until the upgraded installation is verified.
:::

## Rollback

If an application upgrade fails:

1. Preserve the failed logs and current database state for diagnosis.
2. Check the release notes for a known migration or configuration requirement.
3. If the prior PICR version remains above the database compatibility floor, it may be safe to run it against the upgraded database.
4. Otherwise, restore the pre-upgrade PostgreSQL backup before starting the older PICR image.

:::danger[Protect the only production copy]
Never test a questionable downgrade against the only copy of production data.
:::
