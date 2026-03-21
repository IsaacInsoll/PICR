## Troubleshooting

### PICR says database migrations failed when Docker has only just started

PICR now distinguishes between:

- the database being unavailable during startup
- an actual Drizzle migration failure

On boot, PICR will retry startup migrations once after 10 seconds if Postgres is not reachable yet. This helps when Docker has started the app container before Postgres is actually accepting connections.

If you are running PICR via Docker Compose, prefer a Postgres `healthcheck` plus `depends_on.condition: service_healthy` as well. That improves startup ordering, while PICR's own retry still protects against the remaining race conditions.

### Can't connect to postgres (DB) server

I've experienced this issue on multiple platforms where the app works fine but development tools / troubleshooting doesn't connect to DB.

Both times it was another postgres server running using the default port of `5432` so I just changed the `docker-compose.yaml` to expose `54321:5432`

- Synology has a 'generic' postgres server running for some of it's built in tools
- Davinci Resolve project server requires connecting to default port, so if you use that you can't expose 5432

Neither of these affect PICR operation, but will be a problem if trying to connect to the PICR DB (EG: troubleshooting or development)

### TypeScript error TS4111 on `styles.className`

If you see:

`Property '<name>' comes from an index signature, so it must be accessed with ['<name>']`

Then CSS module declaration files are likely out of date.

Fix:

1. Run `cd frontend && npm run css:types`
2. Re-run lint/typecheck

PICR prefers dot notation (`styles.className`) with typed CSS modules, so keep the generated `*.module.css.d.ts` files in sync.
