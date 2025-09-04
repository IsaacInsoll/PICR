## Troubleshooting

### Can't connect to postgres (DB) server

I've experienced this issue on multiple platforms where the app works fine but development tools / troubleshooting doesn't connect to DB.

Both times it was another postgres server running using the default port of `5432` so I just changed the `docker-compose.yaml` to expose `54321:5432`

- Synology has a 'generic' postgres server running for some of it's built in tools
- Davinci Resolve project server requires connecting to default port, so if you use that you can't expose 5432

Neither of these affect PICR operation, but will be a problem if trying to connect to the PICR DB (EG: troubleshooting or development)
