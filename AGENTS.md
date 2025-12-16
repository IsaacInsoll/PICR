# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Node/Express GraphQL API + media/DB logic; builds to `dist/server`.
- `frontend/`: Vite + React 19 UI (`src/` routes/components, `public/` assets).
- `shared/`: React/utility modules shared by web and app.
- `app/`: Expo/React Native client.
- `tests/`: Vitest e2e suites, Docker Compose setup, sample media fixtures.
- `docs/`: Dev notes; `readme.md` for a quick overview.
- `lightroom/`: Lightroom Classic plugin prototype.

## Architecture & Runtime
- Runs on servers/NAS via Docker; backend scans media, builds thumbnails, and serves GraphQL.
- Frontend (React 19 + React Compiler) drives the admin UI for secret-link galleries; public links stay static.
- `/shared` powers web and the WIP React Native app.

## Build, Test, and Development Commands
- `npm start`: Runs the dev stack (backend TS watch + nodemon, Vite dev server, Docker services).
- `npm run start:server` / `start:client` / `start:db`: Start layers individually.
- `cd backend && npm run build`: Type-check and emit server JS to `dist/server` for prod/images.
- `cd frontend && npm run build`: Produce the static frontend bundle.
- `npm run gql`: Regenerate typed GraphQL documents after schema/query changes.

## Coding Style & Naming Conventions
- TypeScript-first; functional React components.
- Prettier 3 — keep two-space style and format before committing.
- ESLint checks React hooks, prop destructuring, and React Compiler compatibility; avoid lingering `console` calls.
- Naming: `PascalCase` for components/types, `camelCase` for functions/variables, descriptive kebab/camel file names matching current patterns.

## Testing Guidelines
- `npm test` runs Vitest suites in `tests/`, booting Docker from `tests/compose.yml` and downloading sample media on first run; Docker required.
- Target a case with `npx vitest tests/01-admin-login.test.ts`. Tests expect ports near 6901 free and tear down containers automatically.
- Follow the numbered `NN-*.test.ts` naming to keep ordering predictable; include realistic media where relevant.
- Suites focus on backend/API flows; add frontend/unit coverage alongside feature work when feasible.

## Commit & Pull Request Guidelines
- Use gitmoji + subsystem in commit titles (e.g., `🐛 [backend] fix folder rename crash`, `✨ [frontend] improve gallery search`); 
- Releases must be done by a human running 'npm run release', AI assistants may only suggest the command.
- For PRs: include a concise summary, linked issues, commands/tests executed, and screenshots or GIFs for UI changes.
- Call out DB migrations, GraphQL schema updates, or new env vars in the PR text; regenerate codegen output when the schema changes.
