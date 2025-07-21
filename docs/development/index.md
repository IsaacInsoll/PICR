`# Development
`
- See [Initial Setup](initial-setup.md) if you are setting up a new environment. 
- Check out the [Basic Tutorial](basic-tutorial.md) if you are set up but don't know how to get started.
- [Testing](testing.md) how to create/run tests using vitest.
- [Troubleshooting](troubleshooting.md) might help if you get stuck.

## Development CLI Commands
| Command                    | Description                                            | When to use                                                                                             |
|----------------------------|--------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| `npm start`                | Run "_everything_": Server / DB / Frontend in Dev Mode | Used for 90% of development. <br />  Uses nodemon/vite to reload on changes                             |
| `npm run gql`              | Build GQL files                                        | Run after updating any GQL on server to "see" new stuff, <br />or after updating a query on client side |
| `npx drizzle-kit generate` | generate migration files (optional `--name=xyz`)       | Run when db schema modified and you want to commit changes                                              |


## App Development CLI Commands

> Run from `app` folder. You can replace `ios` with `android` for all commands 

| Command                                       | Description                                                   | When to use                                    |
|-----------------------------------------------|---------------------------------------------------------------|------------------------------------------------|
| `npx expo start`                              | Run Expo app (iOS / android)                                  | Used when developing mobile app                |
| `npx expo export --platform ios`              | Build JS Bundle                                               | Test for JS compile issues like bad imports    |
| `npx expo run:ios`                            | build and run Development Build                               | Used for most mobile dev                       |
| `npx expo run:ios --configuration Release -d` | deploy release version to local device                        | Get 'production' (not dev) app onto device     |
| `npx expo run:android --variant release`      | deploy release version to local device                        | Get 'production' (not dev) app onto device     |
| `npx expo start --no-dev --minify`            | run dev server but with 'production' code                     | Troubleshoot errors that only happen on prod   |
| `npx uri-scheme open picr://<some-url> --ios` | open deep link in simulator                                   | Used for manually testing "open in PICR" links |
| `eas build` then `eas submit`                 | send to EAS for remote building then submission to app stores | Equivilent of 'release' but for expo app       |


## Build Process

The build process is in `.github/workflows/build.yml`. 
 - Github will automatically run this on every push to `master`
 - You can run it locally with the following command: `npm run workflow`

This will run the following commands in order. You can run any of these individually at any time


| Command                        | Description                            | Notes                                             |
|--------------------------------|----------------------------------------|---------------------------------------------------|
| `npm install`                  | 🗃️ Install backend deps               |                                                   |
| `npm run build`                | 🗃️ Build backend (TSC)                | Finds any typescript issues preventing deploy.    |
| `./copy-backend-files.sh`      | 🗃️ Copy non-TS backend files          | Copies backend files "missed" by TSC              |
| `cd frontend && npm install`   | 💄 Install front end deps              |                                                   |
| `cd frontend && npm run build` | 💄 Build frontend (vite)               | Finds any frontend 'build blockers'               |
| `npm run test`                 | 🧪 Create docker image, run tests      | Have everything built first! (IE: commands above) |
| _build artifact_               | 🗜️ Do locally with `npm run workflow` |                                                   |

## Releases

Run `npm run release` which will:
1. Do a full build (backend and frontend) then do tests
2. If successful, ask you for a new version number then push that to github
3. Release push will trigger github actions to build docker images

You can then manually edit the release on github if you want to add release notes. 

## Dev Server
Ports are exposed during development:

| URL                   | Name                  | Description                                                                                                           |
|-----------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------------|
| http://localhost:6900 | PICR Server (backend) | The live updating backend (using nodemon) if you did `npm start`, or a built backend if you are running the container |
| http://localhost:6969 | Front End             | Dynamic frontend (vite HMR) which forwards GQL/file requests to backend (above)<br/>best for front end development    |
| http://localhost:6901 | Testing Server        | When running tests we build a container using this port for running tests against                                     |

For front end development you definitely want to use the 6969 address. For backend either would be fine but I typically just use 6969 anyway.

## Folders
| Folder     | Description                                      |
|------------|--------------------------------------------------|
| `backend`  | Node server source                               |
| `frontend` | React frontend source                            |
| `shared`   | Client logic shared by `frontend` and `app`      |
| `app`      | iOS/Android App (Expo / React Native)            |
| `dist`     | *Compiled* source (frontend/backend/extra files) |
