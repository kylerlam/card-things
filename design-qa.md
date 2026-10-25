# Design verification

The shared framework keeps the current card layout, palette, typography, navigation, and image sizing rules. Deployment content is not part of a visual specification.

Verify these flows against each candidate build:

- An explicitly initialized database opens an empty catalogue with no preloaded categories, tags, or cards.
- Invented cards can represent books, bookmarks, or another collection without software-specific required metadata.
- Card images retain their aspect ratio; an explicit image takes precedence over automatic icon discovery.
- Search, category and tag filters, detail navigation, and return-to-list state work on desktop and mobile.
- Account and administrator routes retain server-side authorization.
- Administrator forms and navigation fit narrow viewports without page overflow.

Run the repository's lint, typecheck, unit tests, browser tests, and production build. Capture screenshots and console findings outside the repository using an isolated test database. Report actual results for the candidate under review; this checklist does not assert that unrun checks passed.
