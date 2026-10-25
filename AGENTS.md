# Project guidelines

## Purpose and scope

CardThings is a card-based website for organizing and showcasing collections. Support independently deployed collections such as books, bookmarks, software, and other curated items. Avoid speculative generalization or expansion into a commercial platform without an explicit scope decision.

Keep the current framework trees on main and dev reusable and empty by default. Real collection content, artwork, runtime databases, account records, private configuration, and secrets belong to each deployment and must not be added to future code commits. Preserve the existing published commit history: legacy commits retain earlier deployment files, and deleting current files does not remove those historical copies. Database schemas, migrations, shared interface assets, and isolated synthetic test fixtures remain part of the framework.

## Language and coordination

Write repository descriptions, documentation, and authored explanatory text in English. Use English Conventional Commits, such as `fix(login): correct redirect`.

AI agents are expected to perform most coding and GitHub work. Parallel agents should use separate branches and worktrees as needed, coordinate edits to shared files, and agree on merge order.

## Git workflow

- Keep `main` stable, reviewed, checked, and releasable.
- Preserve existing published commit IDs. Extract or improve the generic framework through new commits rather than replacing the established history.
- Use the persistent `dev` branch as the experimental base for new features and integration. It may lead `main` with unreleased changes, but both branches share the same generic-code history.
- Start focused feature branches from `dev` and squash each coherent, reviewed feature into `dev`. Use descriptive branch names and separate worktrees when isolation is useful.
- After checks and explicit owner approval, fast-forward `main` to the tested `dev` commit without another release-level squash. Both branches align after a release; tags identify stable versions.
- The `freya` and `lab` lines of work are paused. Do not start, modify, merge, delete, repurpose, or clean up their branches or worktrees unless the repository owner explicitly resumes them.
- Commit and push only when the user asks for Git work. Run relevant available checks and preserve a useful review record without private reasoning or raw command dumps.
- Merge into `main` only after explicit owner approval. Being on `main` does not prove deployment; tags or releases may identify published versions.

## Validation and lessons

Find actual project checks when they exist; do not invent a framework, commands, CI, features, or design approval requirements. Report checks run, failed, or unavailable, and never claim unrun tests passed.

Consult relevant entries in `docs/lesson-learned.md` during planning and before repeating affected work. Record confirmed, meaningful corrections rather than every disagreement or temporary preference. Promote only durable, confirmed project decisions into this file.

Creating a Markdown file does not automatically load it or provide permanent model learning. Do not create skills until a concrete recurring workflow warrants a separately scoped decision. Preserve existing skills; do not migrate them now.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
