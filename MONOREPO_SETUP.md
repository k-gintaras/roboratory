# Roboratory Monorepo Setup Guide

This project uses **pnpm workspaces** for efficient dependency management across multiple packages, apps, and experiments.

## Quick Start

### Installation

From the **root directory**, install all workspace dependencies once:

```bash
pnpm install
```

This installs all dependencies for:
- `packages/*` (core libraries)
- `apps/*` (applications)
- `experiments/*` (experimental projects)

Everything goes into a single `node_modules` at the root level, eliminating duplicate installations.

### Running Commands

#### From Root (All Workspaces)

```bash
# Run tests across all packages and apps
pnpm test

# Build all packages
pnpm pkg:build

# Start the API app
pnpm start:api

# Run a script in a specific workspace
pnpm --filter @roboratory/db-core run build
```

#### From a Specific Workspace

```bash
cd experiments/tagged-music
pnpm run setup
pnpm run upload
```

Or from root with filter:

```bash
pnpm --filter tagged-music run setup
```

## Workspace Structure

### Packages (`packages/*`)

Core reusable libraries shared across the monorepo:

- **db-core**: Base database abstractions
- **db-postgres**: PostgreSQL database implementation
- **db-sqlite**: SQLite database implementation
- **fs-tools**: File system utilities

All packages are exported with the `@roboratory/` namespace.

### Apps (`apps/*`)

Production applications:

- **api-node**: Node.js API server

### Experiments (`experiments/*`)

Experimental and proof-of-concept projects:

- **tagged-music**: Music tagging system with SQLite
- **exp-2026-01-starter**: Template for new experiments
- Others: various experimental features

## Key Principles

### ✅ DO

1. **Install from root**: Always run `pnpm install` from the root directory
2. **Use workspace references**: Link packages with `workspace:` protocol
3. **Leverage filters**: Use `pnpm --filter` to run scripts in specific workspaces
4. **Share configs**: Extend `tsconfig.json`, Jest configs from root
5. **Add experiments freely**: New experiments are auto-included via `pnpm-workspace.yaml`

### ❌ DON'T

1. **Never create local node_modules**: Don't run `pnpm install` inside individual workspaces
2. **Never use npm**: Always use pnpm for consistency
3. **Never create separate lock files**: There's only one `pnpm-lock.yaml` at root
4. **Never check in node_modules**: Add to `.gitignore`

## Adding a New Experiment

### Example: Creating `experiments/my-new-experiment`

#### 1. Create the folder structure

```bash
mkdir experiments/my-new-experiment
cd experiments/my-new-experiment
```

#### 2. Create `package.json`

```json
{
  "name": "my-new-experiment",
  "version": "1.0.0",
  "description": "Description of your experiment",
  "private": true,
  "scripts": {
    "dev": "ts-node index.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

#### 3. Create `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["."],
  "exclude": ["node_modules"]
}
```

#### 4. Create your experiment code

```bash
touch index.ts
# ... add your code
```

#### 5. Install dependencies (from root)

```bash
cd ../../
pnpm install
```

The experiment is **automatically included** in the workspace thanks to `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "experiments/*"
  - "apps/*"
```

#### 6. Run your experiment

```bash
# From root
pnpm --filter my-new-experiment run dev

# Or from the experiment directory
cd experiments/my-new-experiment
pnpm run dev
```

## Adding a New Package

### Example: Creating `packages/my-utils`

#### 1. Create the folder

```bash
mkdir packages/my-utils
cd packages/my-utils
```

#### 2. Create `package.json`

```json
{
  "name": "@roboratory/my-utils",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p .",
    "test": "jest"
  },
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
```

#### 3. Create `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["./src"],
  "exclude": ["node_modules"]
}
```

#### 4. Create `src/index.ts`

```bash
mkdir src
touch src/index.ts
```

#### 5. Install and build

```bash
cd ../../
pnpm install
pnpm pkg:build
```

#### 6. Use in other workspaces

In another workspace's `package.json`:

```json
{
  "dependencies": {
    "@roboratory/my-utils": "workspace:packages/my-utils"
  }
}
```

## Working with Dependencies

### Adding a Dependency

#### To a specific workspace

```bash
cd packages/db-core
pnpm add axios
```

Or from root with filter:

```bash
pnpm --filter @roboratory/db-core add axios
```

#### To all workspaces

```bash
pnpm add -w typescript
```

#### As dev dependency only

```bash
pnpm --filter tagged-music add -D ts-node
```

### Updating Dependencies

```bash
# Update all workspaces
pnpm update

# Update a specific package
pnpm update -i
```

## Useful Commands

```bash
# List all workspace packages
pnpm ls -r

# Show dependency tree
pnpm ls --depth 10

# Run a script in multiple workspaces
pnpm -r run build

# Run a script only in packages
pnpm -r --filter "./packages/*" run build

# Check for duplicate dependencies
pnpm dedupe

# Clean install
pnpm clean
pnpm install
```

## Troubleshooting

### Error: "Invalid workspace: spec"

This usually means a referenced package doesn't exist or has issues:

```bash
# Verify all packages exist
ls packages/
ls apps/
ls experiments/

# Rebuild the monorepo
pnpm clean
pnpm install
```

### Scripts not found in workspace

Make sure you're running from the root or using the `--filter` option:

```bash
# ❌ Wrong - running from experiment
cd experiments/tagged-music
pnpm run setup

# ✅ Correct - running from root
pnpm --filter tagged-music run setup
```

### Dependency conflicts

Use pnpm's workspace resolution to verify and fix:

```bash
pnpm install
pnpm audit
```

## Performance Tips

1. **Cache node_modules**: Avoid repeated installs with `pnpm ci` in CI/CD
2. **Use monorepo scripts**: Root-level scripts in `package.json` coordinate work
3. **Filter by scope**: Use `--filter` to run only what you need
4. **Leverage workspaces**: Share build configs and dependencies at root level

## Resources

- [pnpm Workspace Docs](https://pnpm.io/workspaces)
- [Root-level package.json](./package.json)
- [Workspace config](./pnpm-workspace.yaml)
- [TypeScript config](./tsconfig.json)
- [Example experiment](./experiments/tagged-music/README.md)
