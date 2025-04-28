# Development

- See [Initial Setup](initial-setup.md) if you are setting up a new environment. 
- Check out the [Basic Tutorial](basic-tutorial.md) if you are set up but don't know how to get started.
- [Testing](testing.md) how to create/run tests using vitest.
- [Troubleshooting](troubleshooting.md) might help if you get stuck.

## Development CLI Commands
| Command                    | Description                                            | When to use                                                                                            |
|----------------------------|--------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| `npm start`                | Run "_everything_": Server / DB / Frontend in Dev Mode | Used for 90% of development. Uses nodemon/vite to reload on changes                                    |
| `npm run gql`              | Build GQL files                                        | Run after updating any GQL on server to "see" new stuff, <br/>or after updating a query on client side |
| `npx drizzle-kit generate` | generate migration files (optional `--name=xyz`)       | Run when db schema modified and you want to commit changes                                             |


## Release / Testing Commands
| Command                            | Description                               | When to use                                                                                 |
|------------------------------------|-------------------------------------------|---------------------------------------------------------------------------------------------|
| `npm run build`                    | Build Server (TSC)                        | Done before creating docker image. Also finds any typescript issues preventing deploy.      |
| `cd frontend && npm run build`     | Build frontend                            | Update front end build (do this before doing backend build)                                 |
| `npm run test`                     | Create docker image, run tests            | Runs tests, you should `npm run build` first                                                |
| `npm run release`                  | Tag new version, build+push docker images | Run when we have something 'release worthy'                                                 |
| `docker compose --profile test up` | Build and run test images                 | Run when all tests are failing to see output of test docker image (EG: picr startup errors) |



## Dev Server
Two ports are exposed during development:

| URL                   | Name                  | Description                                                                                                           |
|-----------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------------|
| http://localhost:6900 | PICR Server (backend) | The live updating backend (using nodemon) if you did `npm start`, or a built backend if you are running the container |
| http://localhost:6969 | Front End             | Dynamic frontend (vite HMR) which forwards GQL/file requests to backend (above)<br/>best for front end development    |

For front end development you definitely want to use the 6969 address. For backend either would be fine but I typically just use 6969 anyway.

## Folders
| Folder     | Description                                            |
|------------|--------------------------------------------------------|
| `backend`  | Node server source                                     |
| `dist`     | *Compiled* Node Server Source                          |
| `frontend` | React frontend source                                  |
| `public`   | *Compiled* React front end and any other static assets |
