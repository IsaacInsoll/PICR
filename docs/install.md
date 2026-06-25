# How to install PICR

## Using Docker

Picr is built to be run as a docker container on your NAS / Server.

There are other ways you could install it, but docker is recommended and the only officially supported method.

If you have never used docker before then just google _"install docker on <type-of-server>"_ (EG: windows 10 / mac os
15 / synology)

Once installed, we will use the following docker compose file. This is basically a "recipe" for PICR and a postgres
database.

## Compose file

Create an empty folder on your server (perhaps called `picr`) and put the following `compose.yml` file in there.

```yaml
services:
  picr:
    container_name: 'picr'
    image: 'isaacinsoll/picr'
    # user: "<uid>:<gid>" # if enabling write access on NAS, see can_write.md to find exact IDs
    volumes:
      - <path-to-your-shared-images>:/home/node/app/media:ro # read only access to your 'files i give to clients' folder
      - ./cache:/home/node/app/cache #where PICR will store thumbnails it generates, no need to back it up
    depends_on:
      db:
        condition: service_healthy
    ports:
      - '6900:6900' # presumably reverse proxy will handle HTTPS
    environment:
      - BASE_URL=https://clients.mydomain.com/ #change this to your URL
      - DATABASE_URL=postgres://user:pass@db/picr
      - USE_POLLING=true # recommended if you have > 10,000 files
  db:
    image: postgres:17
    container_name: picr-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: picr
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U user -d picr']
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 5s
    volumes:
      - ./data:/var/lib/postgresql/data #database storage, you should back this up
```

The `healthcheck` and `depends_on.condition: service_healthy` pairing is recommended so PICR waits for Postgres to be ready, not just started. PICR also retries its startup migrations once after 10 seconds if the database is still unavailable, which helps with slower disks or NAS startup timing.

## Volumes (File Locations)

**Create these folders before starting PICR for the first time.** If Docker creates them automatically it will do so as
`root`, which will prevent PICR from writing thumbnails.

```bash
mkdir -p ./cache ./data
sudo chown -R 1000:1000 ./cache ./data
```

PICR runs inside the container as UID `1000` (the `node` user). The `cache` and `data` folders on your host must be
owned by that same UID so the container can write to them.

| Folder  | Description                                                                                                                                                                                 | Backup         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| `data`  | database (you should back this up!) <br/>Technically it's used by `db` not `picr`                                                                                                           | Yes            |
| `media` | mount point containing folders of images, PICR only needs read access. <br/>Often this would be a folder that already exists unless you are starting from scratch                           | Yes            |
| `cache` | thumbnails, zip files built from your media <br />It is safe to **delete the contents** of this folder, but do not delete the folder itself. <br />Contents will be recreated automatically | (not required) |

If you have a folder you are already using then point the `media` mount to that, otherwise you can make a new folder
wherever you want.

Typically `data` and `cache` will be created in the folder you are putting the `compose` file in for simplicity but you
can put them anywhere that is writable.

> **Thumbnails not showing?** See [Troubleshooting](troubleshooting.md).

## Reverse Proxy / Port Forwarding

Like most publicly accessible self hosted apps: PICR doesn't do HTTPS and you are expected to put it behind a _Reverse
Proxy_ which basically does all the security stuff like HTTPS (and optionally blocking the bad guys).

I'm personally using Nginx Proxy manager but any of them will work fine.

If you are planning on making this accessible over the internet (rather than just playing around with it within your
home network) you should definitely set up a reverse proxy. Set `BASE_URL` to the reverse proxy address.

## Environment variables

There are lots of environment variables you can use, but only a few are needed:

- `BASE_URL` the public facing URL including a trailing slash. eg https://clients.mydomain.com/.  
  PICR will actually respond on all domains that point to it, but this is the domain used when sending out external
  links. This URL will also need to be set up on your reverse proxy.

- `DATABASE_URL` You can leave the defaults here, which match the `db` container listed lower in the docker file.

- `USE_POLLING` this means files aren't detected "instantly" and will take 20 seconds to be discovered. This has been
  found to be useful when you have a large number of files.

- `CAN_WRITE` [optional] You can turn this on later if needed, see [can_write.md](can_write.md)
  Note: write support needs both `CAN_WRITE=true` and real filesystem write permission on `/home/node/app/media`
  inside the container.

- `LOGIN_RATE_LIMIT_*` [optional] Login brute-force protection controls.
  Defaults are sensible for most setups (15-minute window, per-IP and per-user/IP limits, temporary block on abuse),
  so you can usually leave these unset.

- `DISABLE_ACCESS_LOGS` [optional] Set to `true` to stop recording AccessLog entries for folder views and downloads.
  This also suppresses folder-view notifications (they ride on the same code path). Existing log rows are not deleted.
  Useful for privacy-sensitive deployments or to reduce database growth. Requires a server restart to change.

- `VIDEO_ACCELERATION` / `VIDEO_ACCELERATION_DEVICE` [optional] Hardware video acceleration (VAAPI).
  You don't normally need to set either — just pass a GPU into the container and it's auto-detected.
  See [Hardware Video Acceleration](#hardware-video-acceleration-vaapi) below.

## Run PICR

Start the docker compose stack and it should start PICR and the postgres database.
You should see output in docker saying 'you need a token secret, heres one...', add that to your `compose.yml` and then
start the container again.

If Postgres is still booting when PICR starts, PICR will wait 10 seconds and retry once before treating startup as a real failure.

Once it's up and running you can then log in. Go to the url (EG: http://<ip-address>:6900/) and login with the default
login of `admin` / `picr1234`

Change the account details (username and password), then start using PICR 🔥

## Hardware Video Acceleration (VAAPI)

PICR detects an Intel or AMD GPU via VAAPI and exposes it for video work. It is
optional, Linux + `amd64` only, and fully opt-in: with no GPU passed into the
container PICR behaves exactly as before.

> **What is accelerated today?** Honestly — nothing in normal use yet. PICR's
> current video workload is thumbnail generation, and benchmarking showed VAAPI
> is _slower_ than the CPU for that (extracting a handful of seeked frames is
> dominated by GPU setup overhead). So **thumbnails are generated on the CPU**.
> VAAPI is, however, dramatically faster for whole-video transcoding (~2.5–3×),
> so this is groundwork for upcoming transcoding features. For now you can see
> the detected GPU on the **Server Info** page and compare CPU vs VAAPI yourself
> with the admin **Benchmark** tool.

### How it works

- VAAPI drivers are bundled in the `amd64` image (Intel `iHD` + AMD `radeonsi`).
  The `arm64` image does not include them.
- On startup PICR probes the render device and reports VAAPI as available if it
  works; otherwise it logs one line explaining why. A broken or missing GPU never
  stops PICR from starting.
- You can see the resolved status (and which codecs the GPU supports) on the admin
  **Server Info** page, e.g. _"VAAPI — Intel iHD driver … — H.264, HEVC, VP9"_.
- The admin **Benchmark** runs each video step on both CPU and VAAPI so you can
  compare them on your own hardware.

### Enabling it

Pass the GPU render device into the `picr` service. That is usually all you need —
acceleration is auto-detected:

```yaml
services:
  picr:
    # ...existing config from the compose file above...
    devices:
      - /dev/dri:/dev/dri
    group_add:
      - '<render-gid>' # see below
```

The container runs as the `node` user, so it must be in the host's `render` group
to reach the GPU. Find that group's numeric ID **on the host**:

```bash
getent group render
# e.g. render:x:992:   ->   992 is the GID to use
```

Put that number under `group_add`. The GID varies between machines, so don't copy
a value from another host.

### Optional overrides

- `VIDEO_ACCELERATION=off` — force CPU even when a GPU is present (useful if a
  driver produces corrupted output).
- `VIDEO_ACCELERATION_DEVICE=/dev/dri/renderD129` — target a specific render node
  when you have multiple GPUs (defaults to `/dev/dri/renderD128`).

If acceleration isn't engaging, see
[Troubleshooting → Hardware video acceleration](troubleshooting.md#hardware-video-acceleration-not-working).
