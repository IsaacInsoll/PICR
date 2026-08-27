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
- Chokidar's `getWatched()` includes the parent entry that points at `WATCH_ROOT`; operational counts
  must filter the map to `WATCH_ROOT` and its descendants before counting directories or entries.
- A watcher error can arrive during the initial walk before `run()` stores the returned watcher.
  `startWatcher()` therefore owns closing the watcher before it forwards a fatal watcher error; do not
  move that first close exclusively into application shutdown.
- Directory hints absorbed into a pending reconcile marker must escalate it to `force`; leaving it as
  `auto` would let the backend skip the reconcile after Ping had already discarded the precise hints.
- During normal shutdown, do not flush held unlink hints as direct source-folder scans. Collapse them
  into one forced watch-prefix reconcile so a cross-folder move can discover its destination before
  cleanup archives the source.
- A change to shared code imported by Ping requires a Ping version bump before publishing, because
  `shared/**` is part of the image build trigger.
- A `protocolVersion` bump must wait until the compatible PICR backend has been released.
- Every Ping release publishes both its numbered version and `latest`. Customer documentation uses
  `latest`; document an explicit compatibility requirement only when a breaking change needs one.

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

The Docker build context must include `shared/package.json`. With `module: NodeNext`, TypeScript uses
the nearest package's `type` field to choose ESM or CommonJS emission for imported shared sources.

Releases are human-only. `npm run release:ping` performs the preflight and creates the release commit;
CI owns image publishing.
