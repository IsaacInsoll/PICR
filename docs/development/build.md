
## Build Process (frontend/backend)

The build process is in `.github/workflows/build.yml`.

- Github will automatically run this on every push to `master`
- You can run it locally with the following command: `npm run workflow`

This will run the following commands in order. You can run any of these individually at any time

| Command                        | Description                           | Notes                                             |
| ------------------------------ | ------------------------------------- | ------------------------------------------------- |
| `cd backend && npm install`    | 🗃️ Install backend deps               |                                                   |
| `cd backend && npm run build`  | 🗃️ Build backend (TSC)                | Finds any typescript issues preventing deploy.    |
| `./copy-backend-files.sh`      | 🗃️ Copy non-TS backend files          | Copies backend files "missed" by TSC              |
| `cd frontend && npm install`   | 💄 Install front end deps             |                                                   |
| `cd frontend && npm run build` | 💄 Build frontend (vite)              | Finds any frontend 'build blockers'               |
| `npm run test`                 | 🧪 Create docker image, run tests     | Have everything built first! (IE: commands above) |
| _build artifact_               | 🗜️ Do locally with `npm run workflow` |                                                   |
