# Development

- See [Initial Setup](initial-setup.md) if you are setting up a new environment. 
- Check out the [Basic Tutorial](basic-tutorial.md) if you are set up but don't know how to get started.
- [Testing](testing.md) how to create/run tests using vitest.
- [Troubleshooting](troubleshooting.md) might help if you get stuck.

## CLI Commands
| Command                        | Description                                  | When to use                                                                                            |
|--------------------------------|----------------------------------------------|--------------------------------------------------------------------------------------------------------|
| `npm start`                    | Run Server + Frontend in Dev Mode            | When doing any dev and wanting instant reloads on changes of server or client files                    |
| `cd frontend && npm run build` | Build frontend                               | Update front end build (before doing backend build)                                                    |
| `npm run build`                | Build Server (including client)              | Before making docker image                                                                             |
| `npm run gql`                  | Build GQL files                              | Run after updating any GQL on server to "see" new stuff, <br/>or after updating a query on client side |
| `npm run test`                 | Build server, create docker image, run tests | Check that you haven't broken anything on the backend before a commit or release                       |
| `npm run test-only`            | Create docker image, run tests               | Same as above, but doesn't do `npm run build` first so it's faster if you have already built           |
| `npm run release`              | Tag new version, build+push docker images    | Run when we have something 'release worthy'                                                            |

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
