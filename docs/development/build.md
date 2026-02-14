## Build Process (frontend/backend)

The build process is in `.github/workflows/build.yml`.

- Github will automatically run this on every push to `master`
- You can run it locally with the following command: `npm run workflow`

This will run the following commands in order. You can run any of these individually at any time

| Command                        | Description                            | Notes                                                         |
| ------------------------------ | -------------------------------------- | ------------------------------------------------------------- |
| `cd shared && npm ci`          | 🗃️ Install shared deps                 | Used by backend/frontend/app builds                           |
| `cd backend && npm ci`         | 🗃️ Install backend deps                |                                                               |
| `cd backend && npm run build`  | 🗃️ Build backend + copy artifact files | Runs TSC, then copies package files + migrations into `dist/` |
| `cd dist && npm ci`            | 🗃️ Install runtime deps for artifact   | Installs the backend runtime deps into `dist/node_modules`    |
| `cd frontend && npm ci`        | 💄 Install front end deps              |                                                               |
| `cd frontend && npm run build` | 💄 Build frontend (vite)               | Finds any frontend 'build blockers'                           |
| `npm run test`                 | 🧪 Create docker image, run tests      | Have everything built first! (IE: commands above)             |
| _build artifact_               | 🗜️ Do locally with `npm run workflow`  |                                                               |

## Local DX helper commands

To avoid repeated folder hopping:

| Command               | Description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| `npm run install-all` | Install root + shared + backend + frontend + app dependencies                         |
| `npm run build:local` | Build backend artifact, package Lightroom plugin, build frontend, install `dist` deps |
