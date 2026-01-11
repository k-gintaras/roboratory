<!-- Copilot / AI agent instructions for contributors working in this monorepo -->
# Roboratory — Copilot Guidance

Purpose: concise, actionable pointers so AI coding agents become productive quickly in this repo.

- **Big picture**: This is a pnpm monorepo of experiments, shared packages, and apps. Top-level workspaces live in `apps/`, `packages/`, and `experiments/`. Shared runtime contracts are in `packages/*` (see `packages/db-core/src/index.ts`) and adapters live in `packages/db-postgres` and `packages/db-sqlite`. `apps/api-node` is a small Express app that imports local packages.

- **Essential docs to read first**: `EXPERIMENT_TEMPLATE.md`, `MONOREPO_SETUP.md`, and `QUICK_REFERENCE.md` — they capture workspace rules, install flow, and experiment structure.

- **Install & run rules (must-follow)**:
  - Always run `pnpm install` from the **repo root** (the monorepo uses a single `node_modules` and one `pnpm-lock.yaml`).
  - Use workspace filters to run scripts: `pnpm --filter <pkg-or-folder> run <script>` or `pnpm --filter "./experiments/*" run build`.
  - Do not run `pnpm install` inside an experiment or package (no local `node_modules` or local lockfiles).

- **Build & test**:
  - Packages build with `tsc -p .` (see `packages/*/package.json`).
  - Root scripts: `npm run pkg:build` (build packages), `npm run api:dev` (dev server), `npm run test` (workspace tests).

- **Agent workflow conventions (project-specific)**:
  - When asked to work on code, first read `todo.md` at repo root and pick the top unfinished task.
  - If the task lacks clarity, ask one concise clarifying question before coding.
  - Consult `lessons_learned.md` when stuck — look for previously-resolved pitfalls.
  - Check `note.md` for repository author preferences (shortness, file-splitting, etc.).
  - After completing a task, update `todo.md` to mark it done and add a 1–2 line note about what changed.

- **Experiment conventions** (from `EXPERIMENT_TEMPLATE.md`):
  - Experiments should extend the root `tsconfig.json` with `"extends": "../../tsconfig.json"`.
  - Use `workspace:` protocol to depend on local packages (example in `EXPERIMENT_TEMPLATE.md`).
  - Use minimal `package.json` per experiment; prefer adding shared deps at root when broadly reused.

- **Root README & metadata**:
  - Keep the root `README.md` updated when adding/removing experiments or apps. Add a short bullet to the `Recent additions` section (file `README.md`).
  - Add any troubleshooting or environment notes to `MONOREPO_SETUP.md` and cross-link from the root `README.md`.

- **Files to inspect for examples**:
  - `apps/api-node/src/index.ts` — app entry that uses `@roboratory/db-postgres`.
  - `packages/db-core/src/index.ts` — shared interfaces and in-memory stub.
  - `EXPERIMENT_TEMPLATE.md` — canonical experiment structure and commands.

- **When proposing changes**:
  - Prefer small, local edits and update tests where applicable.
  - If changing a package API, update dependent workspaces and note migration steps in the PR description.
  - Document new environment variables in `MONOREPO_SETUP.md` or the package README.

Files added by project policy: `todo.md`, `lessons_learned.md`, and `note.md` live at repo root — read them before acting.

If anything here is unclear or you'd like per-package run snippets added, tell me which packages to expand.
