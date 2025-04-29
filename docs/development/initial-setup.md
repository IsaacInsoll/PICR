
# Initial Setup

1. Install `node`, `npm`, `docker` if they aren't already installed
2. Clone PICR repo
3. Set up DB server (`compose.yml` below)
4. Set up `.env` file (below)
5. Install deps (`npm install && cd frontend && npm install && cd ..`)
6. Create empty `cache` folder and a `media` folder with some subfolders of images (demo data below)
7. `npm start`
8. Visit http://localhost:6969 and use login details found in `backend/auth/defaultCredentials.ts` to log in

#### Optional extra steps

- [Install ACT](https://nektosact.com/installation/index.html) so you can run github workflows locally using `npm run workflow`
- Set up _locator.js_ with instructions below so you can alt-click on front end elements and be taken to the correct file in your IDE

### 3. Database Server
#### `compose.yml`
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
volumes:
  picr-db-data:
```
Run a `docker compose up` to make sure it works correctly

### 4. .ENV File
Copy this, make changes as necessary
```dotenv
BASEURL=http://localhost:6969
DEBUG_SQL=false
CONSOLE_LOGGING=true
USE_POLLING=true
TOKEN_SECRET=<some-long-string>
DATABASE_URL=postgres://user:pass@localhost/picr
POLLING_INTERVAL=20
NODE_ENV=development
GITHUB_TOKEN="f941e0..." #only needed if wanting to do releases
```

### 6. Set up folders
- Create empty`cache` folder. These is where DB stores data and where PICR stores thumbnails/zips.  
  You can delete the contents of this folder at any time without fear.
- Create a `media` folder which should have a few subfolders and put a couple of images in each folder.
  For example, create a `people` and `pets` folder and put a few pics in each.

Demo files used for testing: https://photosummaryapp.com/picr-demo-data.zip

### 9. Set up Locator.js
This is a simple tool that allows you to hold `alt` key and click on any component while in Chrome and it will automatically open your IDE with the specific file open. 
It's not required at all but is a nice convenience. 

If you are running JetBrains PHPStorm to edit then the options you want are:
- Install locator.js chrome extension
- Load the dev server, hold `alt` to trigger Locator then in bottom left go to settings
- REGEX: from: path where picr installed EG: `\/home\/isaac\/picr\/` to `` (nothing)
- EDITOR / LINK TEMPLATE: `jetbrains://phpstorm/navigate/reference?project=picr&path=${filePath}:${lineMinusOne}:${columnMinusOne}`


