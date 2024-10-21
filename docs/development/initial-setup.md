
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

### Demo files
If you don't have your own media to test with then use this:

https://photosummaryapp.com/picr-demo-data.zip

This has also been created for future use when we set up testing.