# Picr

Self-hosted online image sharing tool for photographers to share photos with clients.

#### I built this because:
- Google Drive charges too much for storage
- I want the ability to log visits (IE: see when clients accessed photos)
- Have star ratings or thumbs up/down from clients which I can export (as 'selects' for example)

#### Goals:
- Single node based container that can deploy to any device, specifically targeting good performance on Synology NAS
- Easy to set up and use by my photographer friends who aren't familiar with docker/compose/etc

## Mounts

For development, just make these folders.
When we have a docker image this is the two folders you want to mount

| Folder | Description                                                                             |
|--------|-----------------------------------------------------------------------------------------|
| data   | mount point for all PICR storage (IE: database, thumbnails), can be empty when starting |
| media  | mount point containing folders of images, this is why we are here!!                     |


## Development

`npm run build` to compile typescript and run the server (more like in production)
`npm start`* to run both typescript watcher and nodemon server (for live changes to node causing reload)
`cd frontend && npm run build` build front end
`cd frontend && npm start` run react dev server (currently untested :/)
`cd frontend && npm run gql` build gql
* known issue is that the `cli-progressbar` doesn't work with `concurrently` so progress bars are invisible :/

| Folder   | Description                                            |
|----------|--------------------------------------------------------|
| src      | Node server source                                     |
| dist     | *Compiled* Node Server Source                          |
| frontend | React frontend source                                  |
| public   | *Compiled* React front end and any other static assets |
