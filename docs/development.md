
# Development

## CLI Commands
| Command                        | Description                               | When to use                                                                                            |
|--------------------------------|-------------------------------------------|--------------------------------------------------------------------------------------------------------|
| `npm start`                    | Run Server + Frontend in Dev Mode         | When doing any dev and wanting instant reloads on changes of server or client files                    |
| `npm run build`                | Build Server (including client)           | Before making docker image                                                                             |
| `cd frontend && npm run build` | Build frontend                            | Update front end build (before doing backend build)                                                    |
| `cd frontend && npm run gql`   | Build GQL files                           | Run after updating any GQL on server to "see" new stuff, <br/>or after updating a query on client side |
| `npm run release`              | Tag new version, build+push docker images | Run when we have something 'release worthy'                                                            |


known issue is that the `cli-progressbar` doesn't work with non-tty like  `concurrently` and `docker compose up` so progress bars are invisible :/
You can work around docker with `docker compose run picr` which gives you a tty/interactive console

| Folder   | Description                                            |
|----------|--------------------------------------------------------|
| src      | Node server source                                     |
| dist     | *Compiled* Node Server Source                          |
| frontend | React frontend source                                  |
| public   | *Compiled* React front end and any other static assets |

## Building Release Version to Docker Hub

Run `npm run release` to use _release-it_ to increment version, tag release, build, push to docker hub and make a release on GitHub.

Troubleshooting:
- If you haven't ever run `docker login` then you won't be able to push.
- Check for GITHUB_TOKEN in .ENV
- See [this link](https://dev.to/equiman/sharing-git-credentials-between-windows-and-wsl-5a2a) if `git push` doesn't work inside WSL


# Initial Setup
### Database Server
You will need a DB server running, something like this works great:
```yaml
# Dev composer file: only a database as PICR server running locally
services:
  db:
    image: postgres
    container_name: picr-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: picr
    ports:
      - "5432:5432"
    volumes:
      - ./data:/var/lib/postgresql/data
```

### Sample `.ENV`
Copy this, make changes as necessary
```dotenv
# NOTE: You will need to restart node server after editing these as `nodemon` doesn't monitor this file
VERBOSE=false
DEBUG_SQL=false
USE_POLLING=true
TOKEN_SECRET=<some-long-string>
DATABASE_URL=postgres://user:pass@localhost/picr
POLLING_INTERVAL=20
NODE_ENV=development
GITHUB_TOKEN="f941e0..." #only needed if wanting to do releases
```

### Install dependencies
Run `npm install && cd frontend && npm install && cd ..` so that all dependencies are installed