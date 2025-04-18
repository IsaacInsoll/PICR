
# Initial Setup

1. Install `node`, `npm`, `docker` if they aren't already installed
2. Clone PICR repo
3. Set up DB server (`docker-compose.yml` below)
4. Set up `.env` file (below)
5. Install deps (`npm install && cd frontend && npm install && cd ..`)
6. Create empty `cache` folder and a `media` folder with some subfolders of images
7. `npm start`
8. Visit http://localhost:6969 and use login details found in `backend/auth/defaultCredentials.ts` to log in

### Database Server
You will need a DB server running, something like this works great:

#### `docker-compose.yml`
```yaml
# Dev composer file: only a database as PICR server running locally
services:
  db:
    image: postgres:17
    container_name: picr-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: picr
    ports:
      - "5432:5432"
    volumes:
      - picr-db-data:/var/lib/postgresql/data

#  if you want to run tests, add the below

  test-picr:
    container_name: test-picr
    profiles: [test]
    build: .
    volumes:
      - ./tests/env/media:/home/node/app/media:ro
      - ./tests/env/cache:/home/node/app/cache
    depends_on:
      - test-db
    ports:
      - "6901:6900"
    environment:
      - TOKEN_SECRET=xxx
      - DATABASE_URL=postgres://user:pass@test-db/picr
      - USE_POLLING=true
      - POLLING_INTERVAL=100
  test-db:
    container_name: test-db
    profiles: [test]
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: picr
    volumes:
      - type: tmpfs
        target: /var/lib/postgresql/data
        
# end "test" section, you need the below either way
volumes:
  picr-db-data:
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

### (optional) Set up Locator.js
This is a simple tool that allows you to hold `alt` key and click on any component while in Chrome and it will automatically open your IDE with the specific file open. 
It's not required at all but is a nice convenience. 

If you are running JetBrains PHPStorm to edit then the options you want are:
- Install locator.js chrome extension
- Load the dev server, hold `alt` to trigger Locator then in bottom left go to settings
- REGEX: from: path where picr installed EG: `\/home\/isaac\/picr\/` to `` (nothing)
- EDITOR / LINK TEMPLATE: `jetbrains://phpstorm/navigate/reference?project=picr&path=${filePath}:${lineMinusOne}:${columnMinusOne}`


### Demo files
If you don't have your own media to test with then use this:

https://photosummaryapp.com/picr-demo-data.zip

This has also been created for future use when we set up testing.