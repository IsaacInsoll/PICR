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


### Issues
> TODO: log these as proper issues or just fix them (once we have a repo)
- if you delete images while server down, it won't pick that up when restarted (it just adds new images)
- test with large image collection: may crash due to 'promise stack'?

### TODO
- public facing URLs that don't require login (separate db table) with management tools for that
- logging of 'views' of each image/folder for stats
- star ratings + thumbs up/down + leave comments, with ability to filter/sort/export that data
- download whole folder, individual image, or selected images
- add support for managing users and maybe reporting on file sizes / usage
- branding: upload logo, ability to have multiple 'brands' with certain folders overruling (EG: family portraits and fitness brands)
- email notifications (EG: client opened folder, left feedback etc)
- dockerize and test on synology
- automate build process as much as possible
- publish on github