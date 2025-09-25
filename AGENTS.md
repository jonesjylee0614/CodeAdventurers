# Repository Guidelines

## Project Structure & Module Organization
Source lives under `apps/`, `packages/`, and `services/`. `apps/student` and `apps/teacher` host the React UIs; keep shared UI primitives inside the app-specific `src/` folders until they graduate to a package. Core gameplay logic is centralized in `packages/engine/src`, which is consumed by both frontends and the API. `services/api/src` contains the Express service plus in-memory and MySQL-backed data stores. Level data and fixtures sit in `levels/`, and automation scripts (such as the dev server orchestrator) live in `scripts/`. Tests mirror this layout under `tests/`.

## Build, Test, and Development Commands
Run `npm run dev` to start the TypeScript dev server defined in `scripts/dev-server.ts`; it can proxy API calls and reload simulators. `npm run dev:api` runs the same entry point but is handy for API-only debugging. Use `npm run build` to emit compiled assets into `dist/` via `tsc -b`. Execute `npm run test` (or `npm run test -- --watch`) to launch Jest in band for deterministic engine and API tests.

## Coding Style & Naming Conventions
All code is TypeScript with strict typing; prefer explicit return types on exported functions. Follow the prevailing two-space indentation and trailing comma style seen in the repo. Use PascalCase for React components (`LevelCard`), camelCase for functions and variables, and uppercase snake case for constants. Shared modules should expose stable barrels (e.g., `@engine/index`). Keep localization-ready strings in plain text; avoid hard-coded IDs inside components.

## Testing Guidelines
Jest with Testing Library backs both unit and integration tests. Filename suffixes should stay consistent with existing examples (`engine.test.ts`, `api.test.ts`). Co-locate helper fixtures under `tests/<area>/fixtures/` when they grow beyond a test file. Validate new simulation branches with edge-case coverage (success, failure, guard rails) and assert telemetry or persistence side effects. Always run `npm run test` before opening a pull request and capture relevant snapshots or logs in the PR when behavior changes.

## Commit & Pull Request Guidelines
Commit messages are short, imperative statements (`Fix dev server import path`, `chore: update pnpm-lock`). Group related changes per commit and avoid mixing feature work with lockfile churn. Pull requests should include: a concise summary, linked issue or ticket, test evidence (`npm run test` output or screenshots for UI), and rollout considerations if data migrations or new levels are introduced. Mention any required environment flags so reviewers can reproduce your setup.

## Environment & Configuration Tips
The API defaults to an in-memory store; set `MYSQL_URL` (or `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_DATABASE`, etc.) to enable the MySQL-backed context. Keep secrets in `.env.local` files ignored by Git, and reference them via `process.env`. When seeding or resetting state, use the `/api/system/reset` route or the utilities in `services/api/src/seed.ts`.
