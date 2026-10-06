# Project guidelines

## Purpose and scope

CardThings is a card-based website for organizing and showcasing collections. Prioritize the current site's confirmed practical requirements. Avoid speculative generalization or expansion into a commercial platform without an explicit scope decision.

Separate deployment-specific content, configuration, and private data from reusable framework code and examples. Never commit secrets.

## Language and coordination

Write repository descriptions, documentation, and authored explanatory text in English. Use English Conventional Commits, such as `fix(login): correct redirect`.

AI agents are expected to perform most coding and GitHub work. Parallel agents should use separate branches and worktrees as needed, coordinate edits to shared files, and agree on merge order.

## Git workflow

- Start changes to source, tests, documentation, and other project files on a short-lived task branch from current `main`. Keep one coherent task per branch.
- Use descriptive branch names, such as `feat/card-search`, `fix/mobile-layout`, or `docs/project-guidelines`. Branch names are distinct from Conventional Commit messages.
- Keep `main` reviewed, tested, and releasable. Do not routinely push directly to it. The initial repository commit predates this workflow.
- Open a draft PR and run relevant available checks. Squash merge into `main` only when authorized, then clean up merged task branches as appropriate.
- There is no persistent `dev` branch. A bug found after a merge gets a fresh fix branch from latest `main`; do not resurrect the old feature branch.
- Being on `main` does not prove deployment. Tags or releases may identify published versions.

## Validation and lessons

The current bootstrap is documentation only. Find actual project checks when they exist; do not invent a framework, commands, CI, features, or design approval requirements. Report checks run, failed, or unavailable, and never claim unrun tests passed.

Consult relevant entries in `docs/lesson-learned.md` during planning and before repeating affected work. Record confirmed, meaningful corrections rather than every disagreement or temporary preference. Promote only durable, confirmed project decisions into this file.

Creating a Markdown file does not automatically load it or provide permanent model learning. Do not create skills until a concrete recurring workflow warrants a separately scoped decision. Preserve existing skills; do not migrate them now.
