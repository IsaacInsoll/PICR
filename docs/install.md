# How to install PICR

## Using Docker

Picr is built to be run as a docker container on your NAS / Server.

There are other ways you could install it, but docker is recommended and the only officially supported method.

If you have never used docker before then just google _"install docker on <type-of-server>"_ (EG: windows 10 / mac os
15 / synology)

Once installed, we will use the following docker compose file. This is basically a "recipe" for PICR and a postgres
database.

## Compose file

Create an empty folder on your server (perhaps called `picr`) and put the following `compose.yml` file in there.

```yaml
services:
  picr:
    container_name: 'picr'
    image: 'isaacinsoll/picr'
    volumes:
      - <path-to-your-shared-images>:/home/node/app/media:ro # read only access to your 'files i give to clients' folder
      - ./cache:/home/node/app/cache #where PICR will store thumbnails it generates, no need to back it up
    depends_on:
      - db
    ports:
      - '6900:6900' # presumably reverse proxy will handle HTTPS
    environment:
      - BASE_URL=https://clients.mydomain.com/ #change this to your URL
      - DATABASE_URL=postgres://user:pass@db/picr
      - USE_POLLING=true # recommended if you have > 10,000 files
  db:
    image: postgres:17
    container_name: picr-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: picr
    volumes:
      - ./data:/var/lib/postgresql/data #database storage, you should back this up
```

## Volumes (File Locations)

To avoid permissions issues please create these folders before first starting PICR.

| Folder  | Description                                                                                                                                                             | Backup         |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| `data`  | database (you should back this up!) <br/>Technically it's used by `db` not `picr`                                                                                       | Yes            |
| `media` | mount point containing folders of images, PICR only needs read access. <br/>Often this would be a folder that already exists unless you are starting from scratch       | Yes            |
| `cache` | thumbnails, zip files built from your media <br />It's safe to delete contents of this folder (but not the folder itself!). <br />Contents will be recreated if deleted | (not required) |

If you have a folder you are already using then point the `media` mount to that, otherwise you can make a new folder
whereever you want.

Typically `data` and `cache` will be created in the folder you are putting the `compose` file in for simplicity but you
can put them anywhere that is writable.

## Reverse Proxy / Port Forwarding

Like most publicly accessible self hosted apps: PICR doesn't do HTTPS and you are expected to put it behind a _Reverse
Proxy_ which basically does all the security stuff like HTTPS (and optionally blocking the bad guys).

I'm personally using Nginx Proxy manager but any of them will work fine.

If you are planning on making this accessible over the internet (rather than just playing around with it within your
home network) you should definitely set up a reverse proxy. Set `BASE_URL` to the reverse proxy address.

## Environment variables

There are lots of environment variables you can use, but only a few are needed:

- `BASE_URL` the public facing URL including a trailing slash. eg https://clients.mydomain.com/.  
  PICR will actually respond on all domains that point to it, but this is the domain used when sending out external
  links. This URL will also need to be set up on your reverse proxy.

- `DATABASE_URL` You can leave the defaults here, which match the `db` container listed lower in the docker file.

- `USE_POLLING` this means files aren't detected "instantly" and will take 20 seconds to be discovered. This has been
  found to be useful when you have a large number of files.

- `CAN_WRITE` [optional] You can turn this on later if needed, see [can_write.md](can_write.md)

## Run PICR

Start the docker compose stack and it should start PICR and the postgres database.
You should see output in docker saying 'you need a token secret, heres one...', add that to your `compose.yml` and then
start the container again.

Once it's up and running you can then log in. Go to the url (EG: http://<ip-address>:6900/) and login with the default
login of `admin` / `picr1234`

Change the account details (username and password), then start using PICR 🔥
