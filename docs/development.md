# Development

## Development

Two ports are exposed during development:

| URL                   | Name                  | Description                                                                                                        |
|-----------------------|-----------------------|--------------------------------------------------------------------------------------------------------------------|
| http://localhost:6900 | PICR Server (backend) | The 'built' PICR server running with whatever frontend was last compiled <br/>(usually built during a release)     |
| http://localhost:6969 | Front End             | Dynamic frontend (vite HMR) which forwards GQL/file requests to backend (above)<br/>best for front end development |

For front end development you definitely want to use the 6969 address. For backend either would be fine but I typically just use 6969 anyway.

## CLI Commands
| Command                        | Description                               | When to use                                                                                            |
|--------------------------------|-------------------------------------------|--------------------------------------------------------------------------------------------------------|
| `npm start`                    | Run Server + Frontend in Dev Mode         | When doing any dev and wanting instant reloads on changes of server or client files                    |
| `npm run build`                | Build Server (including client)           | Before making docker image                                                                             |
| `cd frontend && npm run build` | Build frontend                            | Update front end build (before doing backend build)                                                    |
| `cd frontend && npm run gql`   | Build GQL files                           | Run after updating any GQL on server to "see" new stuff, <br/>or after updating a query on client side |
| `npm run release`              | Tag new version, build+push docker images | Run when we have something 'release worthy'                                                            |


| Folder     | Description                                            |
|------------|--------------------------------------------------------|
| `backend`  | Node server source                                     |
| `dist`     | *Compiled* Node Server Source                          |
| `frontend` | React frontend source                                  |
| `public`   | *Compiled* React front end and any other static assets |

## Building Release Version to Docker Hub

Run `npm run release` to use _release-it_ to increment version, tag release, build, push to docker hub and make a release on GitHub.

Troubleshooting:
- If you haven't ever run `docker login` then you won't be able to push.
- Check for GITHUB_TOKEN in .ENV
- See [this link](https://dev.to/equiman/sharing-git-credentials-between-windows-and-wsl-5a2a) if `git push` doesn't work inside WSL


# Initial Setup

1. Install `node`, `npm`, `docker` if they aren't already installed
2. Clone PICR repo
3. Set up DB server (`docker-compose.yml` below)
4. Set up `.env` file (below)
5. Install deps (`npm install && cd frontend && npm install && cd ..`)
6. Create empty `cache` folder and a `media` folder with some subfolders of images
7. `npm start`
8. Visit http://localhost:6969 and use login `admin` / `picr1234` to get started

### Database Server
You will need a DB server running, something like this works great:

#### `docker-compose.yml`
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
      - ./database:/var/lib/postgresql/data
```
Run a `docker compose up` to make sure it works correctly

#### `.ENV`
Copy this, make changes as necessary
```dotenv
DEBUG_SQL=false
CONSOLE_LOGGING=true
USE_POLLING=true
TOKEN_SECRET=<some-long-string>
DATABASE_URL=postgres://user:pass@localhost/picr
POLLING_INTERVAL=20
NODE_ENV=development
GITHUB_TOKEN="f941e0..." #only needed if wanting to do releases
```

### Install dependencies
Run `npm install && cd frontend && npm install && cd ..` so that all dependencies are installed

### Set up folders
- Create empty`cache` folder. These is where DB stores data and where PICR stores thumbnails/zips.  
  You can delete the contents of this folder at any time without fear.
- Create a `media` folder which should have a few subfolders and put a couple of images in each folder. 
  For example, create a `people` and `pets` folder and put a few pics in each.

## Troubleshooting

### Can't connect to postgres (DB) server
I've experienced this issue on multiple platforms where the app works fine but development tools / troubleshooting doesn't connect to DB. 

Both times it was another postgres server running using the default port of `5432` so I just changed the `docker-compose.yaml` to expose `54321:5432`
- Synology has a 'generic' postgres server running for some of it's built in tools
- Davinci Resolve project server requires connecting to default port, so if you use that you can't expose 5432

Neither of these affect PICR operation, but will be a problem if trying to connect to the PICR DB (EG: troubleshooting or development)
