# Development and content guide

## Scope

This first experimental milestone is a static collection browser. It includes responsive navigation, a card wall, search, one category filter at a time, title or date sorting, item details, and browser-local favorites. Search, category, and favorites filters compose together. Search matches every whitespace-separated term, case-insensitively, across title, description, details, category, and tags.

The example collection is illustrative. It does not represent real tools, endorsements, personal collections, or a connected service. There is no account, backend, database, tracking, paid API, or remote font. Favorites stay in this browser, use the versioned `cardthings:favorites:v1` key, and do not sync between devices. If storage is unavailable, favorites still work for the current visit with an explanatory status message.

## Run and verify

Tested with Node.js 22.14 and npm. Use a maintained Node.js version compatible with the pinned Vite version.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

For browser tests:

```sh
npx playwright install chromium
npm test
```

The test runner starts or reuses `http://127.0.0.1:4173`. Its two projects cover desktop Chromium and a mobile Chromium viewport. Tests exercise search/filter combinations, empty states, sorting, favorite persistence, unavailable storage, repeated dialog operations, focus return, keyboard navigation, responsive overflow, network requests, console health, and automated axe checks. Mobile emulation is not physical-device or Safari validation.

`npm run format:check` checks the new application, test, and configuration files. `npm run format` formats those files without rewriting the existing project policy documents.

## Replace the collection

Edit `src/content/collection.json`; presentation components live separately in `src/components`, shared behavior in `src/lib`, and design tokens and responsive styles in `src/styles.css`.

The collection has:

- `title` and `description`: the main heading and introduction.
- `example`: keep `true` for the supplied sample data; set `false` only after replacing it with your own collection.
- `categories`: entries with unique `id`, visible `label`, and CSS `color`.
- `items`: entries conforming to `CollectionItem` in `src/lib/types.ts`.

Each item needs a unique stable `id`, `title`, a `category` matching a category ID, `description`, `details`, `tags`, an ISO `YYYY-MM-DD` `added` date, and an `image`. Image `src` is relative to `public/`, without a leading slash; give it a meaningful `alt`. Ordinary image files need only `src` and `alt`; optional CSS `position` and `size` support art direction. The starter uses six generated covers in one local image sprite, reused across twelve entries.

An optional absolute `http://` or `https://` `url` enables the detail view's “Visit resource” link. Unsupported protocols and malformed URLs are ignored. The starter omits resource URLs because its items are illustrative. Keep private deployment content out of the public repository.

## Interaction and access

Press `/` outside an editable field to focus search. All navigation and cards are keyboard operable. Details use a native modal dialog: Escape, the close button, or the backdrop dismisses it; focus returns to the triggering card when it remains present. Reduced-motion settings disable decorative transitions. Favorites are independently operable from opening a card.

## Static hosting

`npm run build` produces static files in `dist/`; `base: './'` keeps bundled paths relative for subdirectory hosting. There is no client-side route fallback requirement. Any static host that serves the directory can be used. This milestone does not configure or publish a deployment.

## Current boundaries

Content is edited in JSON, not in an in-app editor. Filters reset on reload. Favorites do not sync across tabs or devices. The collection is small and loaded at build time; pagination, import/export, runtime schema validation, and very large collections are future work. No additional backend or framework is required for this milestone.
