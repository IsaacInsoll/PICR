# PICR Ping Development Guide

PICR Ping is a small Node sidecar that runs beside the filesystem which owns the media library. It
watches that filesystem and sends directory reconciliation hints to PICR. It never writes media and
never sends remote filesystem stats as authoritative data.

## Boundaries

- Ping may import pure runtime utilities from `shared/`.
- Ping must not import from `backend/`, `frontend/`, or `app/`.
- Keep chokidar and NAS-specific behaviour in `watcher.ts`; batching, mapping, and retry behaviour
  should remain pure and unit-testable.
- `DRY_RUN=true` must never make an outbound PICR request and must work without `PICR_URL` or
  `PICR_PING_TOKEN`.
- Media mounts are read-only. Ping must not add filesystem mutation code.
- A change to shared code imported by Ping requires a Ping version bump before publishing, because
  `shared/**` is part of the image build trigger.
- A `protocolVersion` bump must wait until the compatible PICR backend has been released.

## Validation

Before every Ping commit run:

```bash
npm run format
npm run format:check
cd ping && npm run lint
cd ping && npm run typecheck
cd ping && npm test
```

Run `npm run build` after runtime or packaging changes. Docker changes additionally require a local
build-only `docker buildx build`.

Releases are human-only. `npm run release:ping` performs the preflight and creates the release commit;
CI owns image publishing.
