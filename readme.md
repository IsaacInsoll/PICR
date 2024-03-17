# Picr

Self-hosted online image sharing tool for photographers to share photos with clients.

#### I built this because:
- Google Drive charges too much for storage
- I want the ability to log visits (IE: see when clients accessed photos)
- Have star ratings or thumbs up/down from clients which I can export (as 'selects' for example)

#### Goals:
- Single node based container that can deploy to any device, specifically targeting good performance on Synology NAS
- Easy to set up and use by my photographer friends who aren't familiar with docker/compose/etc

# How to use:
Picr is built to be run as a docker container on your NAS / Server. 
> If you have never used docker before then just google "installer docker on <type-of-server> (EG: windows/linux/synology)

Use the following `docker-compose` file to get started
```yaml
version: "3.7"
services:
  picr:
    container_name: 'picr'
    image: 'ghcr.io/isaacinsoll/picr'
    volumes:
      - <path-to-your-shared-images>:/home/node/app/media:ro # read only access to your 'files i give to clients' folder
      - ./cache:/home/node/app/cache #where PICR will store thumbnails it generates, no need to back it up
    depends_on:
      - db
    ports:
      - "6900:6900" # presumably reverse proxy will handle HTTPS
    environment:
      - TOKEN_SECRET= # leave this out and on first build it will give you a very secret random string to put in here
      - DATABASE_URL=postgres://user:pass@db/picr
      - USE_POLLING=true
  db:
    image: postgres
    container_name: picr-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: picr
    volumes:
      - ./data:/var/lib/postgresql/data #database storage, you should back this up
```
1. Make sure you have docker installed and set up
2. Copy the `docker-compose.yml` example above and modify the volume mount for media (IE: change `./media` to the full path on your host where the photos are stored)
3. Set up the compose file in docker and start PICR. The first run will generate a TOKEN_SECRET for you to add to the compose file. Add that and restart the container
4. Go to http://<ip-address>:6900/admin and login with default login of `admin` / `password`, change the account details, and start sharing your images!

### Mounts

| Folder | Description                                                                |
|--------|----------------------------------------------------------------------------|
| data   | database (you should back this up!)                                        |
| media  | mount point containing folders of images, only need read access            |
| cache  | thumbnails, zip files built from your media (will be recreated if deleted) |

# Development
See [docs/development.md](docs/development.md)
