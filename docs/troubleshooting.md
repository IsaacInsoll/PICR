# Troubleshooting

## Thumbnails not showing / permission denied errors

**Symptoms:**

- Images load but thumbnails never appear
- Docker logs contain `EACCES: permission denied` or `mkdir ... EACCES (-13)`
- The `cache` folder, or a subfolder such as `cache/thumbs`, is owned by the wrong user

**Cause:**

PICR runs inside the container as UID `1000`. If the `cache` folder on the host was created by Docker automatically (or
by root), PICR cannot write thumbnails into it.

If your Compose file sets a custom `user: "<uid>:<gid>"`, use that UID/GID instead of `1000:1000` for the cache folder.
This is common when `CAN_WRITE=true` is enabled for a NAS media mount, because the container user often needs to match
the NAS media owner. The cache volume must be writable by the same container user. For example, a container running as
`user: "1026:100"` needs the host cache folder, including `cache/thumbs`, to be writable by `1026:100`.

**Fix:**

Stop the container, fix ownership of the `cache` folder, then restart:

```bash
docker compose down
sudo chown -R 1000:1000 ./cache
docker compose up -d
```

For a custom container user, replace `1000:1000` with the UID/GID from your Compose file:

```bash
docker compose down
sudo chown -R 1026:100 ./cache
sudo find ./cache -type d -exec chmod 775 {} +
sudo find ./cache -type f -exec chmod 664 {} +
docker compose up -d
```

Thumbnails will regenerate automatically once the container has write access.

You can verify cache write access from inside the running container:

```bash
docker compose exec picr sh -lc '
set -eu
id
stat -c "%n owner=%u:%g mode=%A" /home/node/app/cache /home/node/app/cache/thumbs
mkdir -p "/home/node/app/cache/thumbs/__picr_probe__/nested"
echo ok > "/home/node/app/cache/thumbs/__picr_probe__/nested/write-test.txt"
cat "/home/node/app/cache/thumbs/__picr_probe__/nested/write-test.txt"
rm -f "/home/node/app/cache/thumbs/__picr_probe__/nested/write-test.txt"
rmdir "/home/node/app/cache/thumbs/__picr_probe__/nested" "/home/node/app/cache/thumbs/__picr_probe__"
'
```

**Prevention:**

Create the `cache` (and `data`) folders yourself before the very first `docker compose up`, as described in
[Installation](install.md#volumes-file-locations). If you let Docker create them it will do so as root.

---

## Thumbnails disappeared after restarting

If you deleted the `cache` folder and restarted, Docker will have recreated it as `root` — see the fix above.

The safe way to clear the thumbnail cache is to **delete the contents** of the folder, not the folder itself:

```bash
rm -rf ./cache/*
```

---

## Can't connect to the Postgres database

If PICR starts but immediately exits with a database connection error, the most common cause is another Postgres
instance already using port `5432` on your host.

Both Synology DSM and DaVinci Resolve run their own Postgres servers on `5432` by default.

Fix — expose the container on a different host port in `compose.yml`:

```yaml
db:
  ports:
    - '54321:5432'
```

This does not affect PICR itself (it connects to Postgres inside Docker using the internal port), but it frees up
`5432` on the host for other tools.

---

## PICR says database migrations failed on first start

PICR retries its startup migrations once after 10 seconds if Postgres is not ready yet. If it still fails, check:

1. The `db` container is running and healthy (`docker compose ps`)
2. Your `compose.yml` includes the `healthcheck` and `depends_on.condition: service_healthy` as shown in
   [Installation](install.md)
3. The `DATABASE_URL` environment variable matches the credentials in the `db` service

---

## Something else?

Check the [GitHub Issues](https://github.com/IsaacInsoll/PICR/issues) — search before opening a new one in case it has
already been reported or resolved.
