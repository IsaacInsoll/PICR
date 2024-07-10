
# Development

`npm run build` to compile typescript and run the server (more like in production)

`npm start`* to run both typescript watcher and nodemon server (for live changes to node causing reload)

`cd frontend && npm run build` build front end

`cd frontend && npm start` run react dev server (currently untested :/)

`cd frontend && npm run gql` build gql

known issue is that the `cli-progressbar` doesn't work with non-tty like
`concurrently` and `docker compose up` so progress bars are invisible :/
You can work around docker with `docker compose run picr` which gives you a tty/interactive console

| Folder   | Description                                            |
|----------|--------------------------------------------------------|
| src      | Node server source                                     |
| dist     | *Compiled* Node Server Source                          |
| frontend | React frontend source                                  |
| public   | *Compiled* React front end and any other static assets |

## Building

`cd frontend && npm run gql && npm run build` to ensure front end is built

`cd .. && npm run build` to build backend

`docker build . -t isaacinsoll/picr:latest` to create docker image (optionally add a second tag (another ` -t` if you want a build number tag as well))

### Releasing to github
Simply `deploy` command, or if you aren't running funky:

Do the 'Building' section above then:
```shell
docker build . -t ghcr.io/isaacinsoll/picr:latest -t <version_number>
docker push ghcr.io/isaacinsoll/picr -a
```

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
- dockerise on normal 'docker hub' so you don't need to do weird ghcr.io stuff on synology
- automate build process as much as possible
- switch to issues in github