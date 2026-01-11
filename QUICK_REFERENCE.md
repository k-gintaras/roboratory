# Quick Reference: Roboratory Monorepo Commands

## Essential Commands

### Installation
```bash
# Install all workspace dependencies (from root)
pnpm install

# Clean install
pnpm clean
pnpm install
```

### Running Scripts

```bash
# Run script in specific experiment
pnpm --filter tagged-music run dev
pnpm --filter tagged-music run setup

# Run script in all experiments
pnpm --filter "./experiments/*" run build

# Run script in all packages
pnpm --filter "./packages/*" run build

# Run from within an experiment directory
cd experiments/tagged-music
pnpm run setup
```

### Adding Dependencies

```bash
# Add to specific workspace
pnpm --filter tagged-music add axios

# Add to root (shared by all)
pnpm add -w typescript

# Add as dev dependency
pnpm --filter my-experiment add -D ts-node
```

### Viewing the Workspace

```bash
# List all workspace packages
pnpm ls -r

# Show dependency tree
pnpm ls --depth 5

# Check for duplicates
pnpm dedupe
```

## Creating a New Experiment

```bash
# 1. Create folder
mkdir experiments/my-experiment
cd experiments/my-experiment

# 2. Create package.json with your dependencies
# 3. Create tsconfig.json (extend from ../../tsconfig.json)
# 4. Add your code

# 5. Install from root
cd ../../
pnpm install

# 6. Run from root or from within the experiment
pnpm --filter my-experiment run dev
```

## Important DON'Ts

❌ **Don't** create local node_modules
```bash
# Wrong
cd experiments/my-experiment
pnpm install
```

❌ **Don't** use npm
```bash
# Wrong
npm install
npm run dev
```

❌ **Don't** commit local lock files
```bash
# Wrong - don't check in these files
node_modules/
package-lock.json
pnpm-lock.yaml (in experiment folders)
```

## File Locations

| File | Purpose |
|------|---------|
| `package.json` | Root workspace config |
| `pnpm-workspace.yaml` | Workspace definition |
| `tsconfig.json` | Root TypeScript config |
| `jest.config.cjs` | Root Jest config |
| `MONOREPO_SETUP.md` | Detailed setup guide |
| `EXPERIMENT_TEMPLATE.md` | Template for new experiments |
| `OPTIMIZATION_SUMMARY.md` | What changed and why |

## Disk Space Savings

**Before**: 500MB × number of experiments
- 5 experiments = 2.5GB
- 10 experiments = 5GB
- 20 experiments = 10GB

**After**: ~500MB total (shared)
- All experiments = 500MB

## Directory Structure Reference

```
roboratory/
├── node_modules/               ← Shared (ONE installation)
├── package.json                ← Workspace config
├── pnpm-workspace.yaml         ← Defines workspaces
├── tsconfig.json               ← Root TS config
├── jest.config.cjs
├── MONOREPO_SETUP.md           ← Read this!
├── EXPERIMENT_TEMPLATE.md      ← Use this template
├── packages/
│   ├── db-core/
│   ├── db-postgres/
│   ├── db-sqlite/
│   └── fs-tools/
├── apps/
│   └── api-node/
└── experiments/
    ├── tagged-music/           ← NO node_modules
    ├── exp-2026-01-starter/    ← NO node_modules
    └── ... (other experiments)  ← NO node_modules
```

## Common Issues

**"Module not found"**
→ Run `pnpm install` from root

**"ts-node not found"**
→ Use `pnpm run` instead of running directly

**"Invalid workspace spec"**
→ Package may not be properly configured. Check that it has a valid package.json

**Dependencies mismatch**
→ Run `pnpm install` to update all workspaces

## Help & Documentation

- **Full Setup Guide**: See [MONOREPO_SETUP.md](./MONOREPO_SETUP.md)
- **Template for New Experiments**: See [EXPERIMENT_TEMPLATE.md](./EXPERIMENT_TEMPLATE.md)  
- **What Changed**: See [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md)
- **This Experiment**: See [experiments/tagged-music/README.md](./experiments/tagged-music/README.md)
