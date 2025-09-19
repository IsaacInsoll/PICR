
# Development

| Doc                                      | Notes                                         |
|------------------------------------------|-----------------------------------------------|
| 🎉 [Contributing](../CONTRIBUTING.md)    | Contribution Guidelines                       |
| 🎉 [Initial Setup](initial-setup.md)     | How to setup development environment          |
| 📱 [App Development](app.md)             | React Native (Expo) App Development           |
| 👷 [Build Process](build.md)             | How backend build process works               |
| 📃 [Basic Tutorial](basic-tutorial.md)   | Basic tutorial on front/backend feature dev   |
| 🧪 [Testing](testing.md)                 | Create and run tests (currently backend only) |
| 🚀 [Releases](release.md)                | How to do releases                            |
| 🐛 [Troubleshooting](troubleshooting.md) | Troubleshooting tips                          |


## Folders

| Folder     | Description                                      |
| ---------- | ------------------------------------------------ |
| `backend`  | Node server source                               |
| `frontend` | React frontend source                            |
| `shared`   | Client logic shared by `frontend` and `app`      |
| `app`      | iOS/Android App (Expo / React Native)            |
| `dist`     | _Compiled_ source (frontend/backend/extra files) |


>  **TODO: MONOLITH REFACTOR NOTES**
>
> I'm currently moving the node backend from being in `.` to `./backend`
> Current problems unaddressed is:
>
> 1. need to do `npm install` in dist folder
> 2. need an `.env` in dist folder
>
> We are doing this because the server should be self contained in `backend` and not have it's `package.json` etc in
> the actual root (like it has been since the beginning).


## Development CLI Commands

| Command                                                              | Description                                            | When to use                                                                                             |
|----------------------------------------------------------------------| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `npm start`                                                          | Run "_everything_": Server / DB / Frontend in Dev Mode | Used for 90% of development. <br /> Uses nodemon/vite to reload on changes                              |
| `npm run gql`                                                        | Build GQL files                                        | Run after updating any GQL on server to "see" new stuff, <br />or after updating a query on client side |
| `cd backend && NODE_OPTIONS='--import tsx' npx drizzle-kit generate` | generate migration files (optional `--name=xyz`)       | Run when db schema modified and you want to commit changes                                              |


## Dev Server

Ports are exposed during development:

| URL                   | Name                  | Description                                                                                                           |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| http://localhost:6900 | PICR Server (backend) | The live updating backend (using nodemon) if you did `npm start`, or a built backend if you are running the container |
| http://localhost:6969 | Front End             | Dynamic frontend (vite HMR) which forwards GQL/file requests to backend (above)<br/>best for front end development    |
| http://localhost:6901 | Testing Server        | When running tests we build a container using this port for running tests against                                     |

For front end development you definitely want to use the 6969 address. For backend either would be fine but I typically just use 6969 anyway.
