
# Initial Setup

1. Install `node`, `npm`, `docker` if they aren't already installed
2. Clone PICR repo
3. Database server using docker
4. Set up `.env` file 
5. Run build steps
6. Create empty `cache` folder and a `media` folder with some subfolders of images (demo data below)
7. `npm start`
8. Visit http://localhost:6969 and use login details found in `backend/auth/defaultCredentials.ts` to log in

#### Optional extra steps

- [Install ACT](https://nektosact.com/installation/index.html) so you can run github workflows locally using `npm run workflow`
- Set up _locator.js_ with instructions below so you can alt-click on front end elements and be taken to the correct file in your IDE

### 3. Database Server
Run a `docker compose up` to start a postgres server with default login credentials

### 4. .ENV File
`cp .env.example .env`
You may optionally add extra fields such as `GITHUB_TOKEN` but these aren't required for development. 

### 5. Run build steps

See [Development Guide](index.md) which covers dependencies and builds for both frontend and backend. 

No need for testing or artifacts (but you are welcome to!) 

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


