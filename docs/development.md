
# Development

## CLI Commands
| Command                        | Description                                  | When to use                                                                                                   |
|--------------------------------|----------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| `npm run build`                | Build Server (including client)              | Before making docker image                                                                                    |
| `npm start`                    | Run "PICR Server" in Dev Mode                | - When doing any back end dev and wanting live updates<br/>- Needing an operational backend for front end dev |
| `cd frontend && npm run build` | Build frontend                               | Update front end build (before doing backend build)                                                           |
| `cd frontend && npm start`     | Run Front End dev server                     | When doing front end development <br/>(requires operational backend)                                          |
| `cd frontend && npm run gql`   | Build GQL files                              | Run after updating any GQL on server to "see" new stuff, <br/>or after updating a query on client side        |
| `./build.sh`                   | Build everything, make and push docker image | Run when we have something 'release worthy'                                                                   |


known issue is that the `cli-progressbar` doesn't work with non-tty like  `concurrently` and `docker compose up` so progress bars are invisible :/
You can work around docker with `docker compose run picr` which gives you a tty/interactive console

| Folder   | Description                                            |
|----------|--------------------------------------------------------|
| src      | Node server source                                     |
| dist     | *Compiled* Node Server Source                          |
| frontend | React frontend source                                  |
| public   | *Compiled* React front end and any other static assets |

## Building Release Version to Docker Hub

Run `./build.sh` to build frontend/backend then build a docker image and push it to docker hub. 

> If you haven't ever run `docker login` then you won't be able to push

## Sample `.ENV`
```
VERBOSE=false
DEBUG_SQL=false
USE_POLLING=true
TOKEN_SECRET=<some-long-string>
DATABASE_URL=postgres://user:pass@localhost/picr
POLLING_INTERVAL=20
NODE_ENV=development
GITHUB_TOKEN="f941e0..." #only needed if wanting to do releases
```

### WSL2 GitHub Credentials (HTTPS)
See (this link)[https://dev.to/equiman/sharing-git-credentials-between-windows-and-wsl-5a2a]

### Issues
> TODO: log these as proper issues or just fix them (once we have a repo)
- if you delete images while server down, it won't pick that up when restarted (it just adds new images)
- test with large image collection: may crash due to 'promise stack'?

### TODO
- logging of 'views' of each image/folder for stats
- star ratings + thumbs up/down + leave comments, with ability to filter/sort/export that data
- download selected files (we have individual image and all files already)
- add support for managing users and maybe reporting on file sizes / usage
- branding: upload logo, ability to have multiple 'brands' with certain folders overruling (EG: family portraits and fitness brands)
- email notifications (EG: client opened folder, left feedback etc)
- automate build process as much as possible
- switch to issues in github