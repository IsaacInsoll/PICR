---
title: Install PICR
description: Install PICR with Docker and prepare your media, cache, and database storage.
---

:::note[Supported installation]
PICR is distributed as a Docker image. Docker Compose is the recommended and officially supported installation method.
:::

You will need:

- A server or NAS that can run Docker Compose
- A folder containing the media you want PICR to publish
- A persistent location for PostgreSQL data
- A writable cache location for thumbnails and generated ZIP files
- Preferably, a domain name and HTTPS reverse proxy before sending links to clients

## 1. Create the installation folders

Create a working directory on the Docker host:

```bash title="Create the PICR directories"
mkdir -p picr/cache picr/data
cd picr
```

PICR runs as UID `1000` by default and must be able to write to `cache`:

```bash title="Set cache ownership"
sudo chown -R 1000:1000 ./cache
```

The PostgreSQL container initialises `data` itself. If your Docker or NAS setup applies custom users or ACLs, ensure the database container can write there too.

## 2. Create the Compose file

Create `compose.yml` in the `picr` directory:

```yaml title="compose.yml" "/path/to/your/client-media" "https://clients.example.com/" "change-this-database-password"
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
      - /path/to/your/client-media:/home/node/app/media:ro
      - ./cache:/home/node/app/cache
    environment:
      BASE_URL: https://clients.example.com/
      DATABASE_URL: postgres://picr:change-this-database-password@db/picr
      FILE_WATCHER: polling
      POLLING_SECONDS: '20'

  db:
    image: postgres:17
    container_name: picr-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: picr
      POSTGRES_PASSWORD: change-this-database-password
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

:::caution[Change the example values]
Change these values before starting:

- Replace `/path/to/your/client-media` with the absolute host path to your gallery library.
- Replace both copies of `change-this-database-password` with the same strong password. If it contains URL-special characters, URL-encode the password in `DATABASE_URL`.
- Replace `https://clients.example.com/` with the address recipients will use, including the trailing slash.
  :::

The media mount is read-only by default. PICR can index, preview, and share the library without permission to modify your originals.

The health check and `depends_on` setting make PICR wait for PostgreSQL to become ready. The PICR image has its own health check for the application and database connection.

## 3. Start PICR and sign in

Start the services and follow the first boot:

```bash title="Start PICR and follow first boot"
docker compose up -d
docker compose logs -f picr
```

Open PICR at the address configured by your reverse proxy, or at `http://<server-address>:6900/` while testing locally.

On a new database, PICR creates an administrator account:

- Username: `admin`, unless `ADMIN_USERNAME` is set
- Password: the value of `ADMIN_PASSWORD`, or a generated password printed once in the PICR logs

If PICR generated the password, find the log entry with:

```bash title="Read the generated administrator password"
docker compose logs picr
```

Sign in and change the administrator username and password under **Settings → Admin Users**.

PICR generates its own signing secret on first boot and stores it in PostgreSQL. A manual `TOKEN_SECRET` is not required for a new installation.

## 4. Check the library

PICR scans the mounted media root during startup. Open the root folder in PICR and confirm that your folders appear.

With `FILE_WATCHER=polling`, later filesystem changes are detected at the configured interval. If a folder is not current, open its menu, choose **Manage**, and use **Scan Now**.

Continue with [Create your first gallery](/PICR/getting-started/first-gallery/).

## Storage and backups

| Location | Contents                                                                            | Back up? |
| -------- | ----------------------------------------------------------------------------------- | :------: |
| `media`  | Your original photo, video, and other gallery files                                 |   Yes    |
| `data`   | Users, public links, branding, comments, ratings, access logs, and other PICR state |   Yes    |
| `cache`  | Regenerable thumbnails and generated downloads                                      |    No    |

:::caution[Back up PICR state as well as media]
Do not treat the media library as the only PICR backup. Recipient links, reviews, and branding live in PostgreSQL.

Follow [Backups and upgrades](/PICR/operations/backups-and-upgrades/) to create a consistent PostgreSQL dump and restore it safely. Copying the live `data` directory is not a substitute for that process.
:::

It is safe to clear the **contents** of `cache`; PICR regenerates them. Keep the cache directory itself and its write permissions intact. See [Troubleshooting](/PICR/operations/troubleshooting/) if thumbnails fail with a permission error.

## Choose how PICR detects changes

The example uses polling because it works reliably with many Docker and NAS mounts.

- `FILE_WATCHER=polling` checks the library at `POLLING_SECONDS` intervals.
- `FILE_WATCHER=native` uses operating-system filesystem events and is a good fit when media is local to the PICR host.
- `FILE_WATCHER=off` disables continuous watching. PICR still scans at boot and when an administrator selects **Scan Now**.
- `ON_VIEW_SCAN=direct_and_new` can refresh active folders while continuous watching is off.
- `SCHEDULED_SCAN_HOURS=24` adds a daily whole-library reconciliation.
- [PICR Ping](/PICR/operations/picr-ping/) provides real-time hints when the library lives on a separate NAS.

Avoid enabling every method without a reason. Start with polling, or native watching for local storage, then change strategy if your storage has different reliability or spin-down requirements.

See [Scanning and change detection](/PICR/operations/scanning/) for strategy comparisons, manual scans, scheduled reconciliation, and monitoring.

## Publish PICR with HTTPS

PICR serves HTTP on port `6900`; it does not terminate HTTPS itself. Put it behind a reverse proxy such as Nginx Proxy Manager, Caddy, Traefik, or another proxy you already operate.

Set `BASE_URL` to the final public HTTPS address. PICR uses it when generating recipient links and notifications.

:::tip[Use HTTPS]
HTTPS is recommended even on a private LAN. Browsers restrict clipboard and other features on plain-HTTP addresses, so **Copy Link** is more reliable from a secure origin.
:::

## Upgrade PICR

Before an upgrade:

1. Read the [release notes](https://github.com/IsaacInsoll/PICR/releases).
2. Create a PostgreSQL dump as described in [Backups and upgrades](/PICR/operations/backups-and-upgrades/).
3. Pull and restart the application:

   ```bash title="Upgrade PICR"
   docker compose pull picr
   docker compose up -d
   docker compose logs -f picr
   ```

PICR applies its application database migrations at startup. It supports a direct upgrade from any release in the previous major version to the next major version unless release notes explicitly require an intermediate stop.

PostgreSQL major-version upgrades are separate. Do not change `postgres:17` to a later major version without following a PostgreSQL migration process documented for that PICR release.

## Useful optional settings

- `ADMIN_USERNAME` and `ADMIN_PASSWORD` set the first administrator credentials when the database has no users. Passwords must contain at least eight characters.
- `CAN_WRITE=true`, together with a read-write media mount, enables administrator rename and move operations. Read [Enable rename and move access](/PICR/operations/write-access/) before using it.
- `DISABLE_ACCESS_LOGS=true` stops recording new view/download access logs and suppresses link-open notifications. Existing logs are not deleted.
- `PICR_PING_TOKEN` enables [PICR Ping](/PICR/operations/picr-ping/) and must contain at least 64 characters.
- `TOKEN_SECRET` is optional. New installations generate and store a secret automatically; the environment setting is retained for explicit and older deployments.

The repository [.env.example](https://github.com/IsaacInsoll/PICR/blob/master/.env.example) lists all supported settings.
The [configuration reference](/PICR/operations/configuration/) groups those settings by customer task.

## Optional hardware video acceleration

PICR's `amd64` image includes VAAPI drivers for compatible Intel and AMD GPUs. Detection is optional and a missing or unusable GPU does not stop PICR.

:::note[VAAPI is informational for normal gallery use]
Current poster and scrub-thumbnail generation still uses the CPU because it performs better for that workload. VAAPI is visible on **Settings → Server Info** and in the benchmark tool, but it does not currently make normal gallery use faster.
:::

To expose a GPU to PICR:

```yaml title="compose.yml — optional VAAPI device"
services:
  picr:
    devices:
      - /dev/dri:/dev/dri
    group_add:
      - '<render-group-id>'
```

Find the host's numeric render-group ID with:

```bash title="Find the render-group ID"
getent group render
```

The `arm64` image does not include VAAPI drivers. See [Hardware video acceleration troubleshooting](/PICR/operations/troubleshooting/#hardware-video-acceleration-not-working) if an expected GPU is reported as unavailable.
