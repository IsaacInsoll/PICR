# Troubleshooting

## Thumbnails not showing / permission denied errors

**Symptoms:**

- Images load but thumbnails never appear
- Docker logs contain `EACCES: permission denied` or `mkdir ... EACCES (-13)`
- The `cache` folder on your host is owned by `root`

**Cause:**

PICR runs inside the container as UID `1000`. If the `cache` folder on the host was created by Docker automatically (or
by root), PICR cannot write thumbnails into it.

**Fix:**

Stop the container, fix ownership of the `cache` folder, then restart:

```bash
docker compose down
sudo chown -R 1000:1000 ./cache
docker compose up -d
```

Thumbnails will regenerate automatically once the container has write access.

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
