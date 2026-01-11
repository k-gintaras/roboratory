# Lessons Learned

This file records short notes about problems encountered and how they were resolved.

- Keep entries short (1–3 lines) with a date and tag.
- Use this to capture pitfalls agents should check first before re-implementing.

Example:

- 2026-01-11: sqlite `sqlite3` native build issues on Windows — solved by using prebuilt binary via `sqlite3` ^5.x and ensuring Node 18+.
- 2026-01-12: avoid adding `node_modules` inside experiments; always run `pnpm install` from root.
