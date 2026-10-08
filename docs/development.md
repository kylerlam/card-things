# Development and content guide

## Scope

This first experimental milestone is a static collection browser. It includes responsive navigation, a card wall, search, one category filter at a time, title or date sorting, item details, and browser-local favorites. Search, category, and favorites filters compose together. Search matches every whitespace-separated term, case-insensitively, across title, description, details, category, and tags.

The example collection is illustrative. It does not represent real tools, endorsements, personal collections, or a connected service. There is no account, backend, database, tracking, paid API, or remote font. Favorites stay in this browser, use the versioned `cardthings:favorites:v1` key, and do not sync between devices. If storage is unavailable, favorites still work for the current visit with an explanatory status message.

## Run and verify

Tested with Node.js 22.14 and npm. Use a maintained Node.js version compatible with the pinned Vite version.

```sh
npm ci
npm run dev
npm run validate:content
npm run build
npm run preview
```

For browser tests:

```sh
npx playwright install chromium firefox webkit
npm test
npm run test:static
```

The default test runner starts or reuses `http://127.0.0.1:4173`. The content project tests validation rules and CLI failures; five browser projects cover desktop Chromium, mobile Chromium, desktop Firefox, desktop WebKit, and mobile WebKit. Tests exercise search/filter combinations, empty states, sorting, favorite persistence, unavailable storage, repeated dialog operations, focus return, keyboard navigation, responsive overflow, network requests, console health, automated axe checks, share links, refresh, history navigation, invalid URL parameters, and clipboard fallback.

`npm run test:static` builds the production files, starts a local static server on port 4175, and reruns all browser cases under `/collections/card-things/`. It also checks mounted assets, query and anchor preservation, direct refreshes, the directory redirect, and explicit `index.html` URLs. This server has no SPA fallback or root-level application assets. Port 4175 must be free before running this command.

These are isolated Playwright browsers, not personal browser profiles. Mobile emulation is not physical-device validation, and Playwright WebKit is not the installed Safari app. See [compatibility verification](compatibility.md) for the tested versions, results, clipboard limits, and known coverage gaps.

`npm run format:check` checks the application, validation script, test, and configuration files. `npm run format` formats those files without rewriting the existing project policy documents.

## Replace the collection

Edit `src/content/collection.json`; presentation components live separately in `src/components`, shared behavior in `src/lib`, and design tokens and responsive styles in `src/styles.css`.

The collection has:

- `title` and `description`: the main heading and introduction.
- `example`: keep `true` for the supplied sample data; set `false` only after replacing it with your own collection.
- `categories`: entries with unique `id`, visible `label`, and CSS `color`.
- `items`: entries conforming to `CollectionItem` in `src/lib/types.ts`.

Each item needs a unique stable `id`, `title`, a `category` matching a category ID, `description`, `details`, `tags`, an ISO `YYYY-MM-DD` `added` date, and an `image`. Image `src` is relative to `public/`, without a leading slash; give it a meaningful `alt`. Ordinary image files need only `src` and `alt`; optional CSS `position` and `size` support art direction. The starter uses six generated covers in one local WebP sprite, reused across twelve entries. Its editable PNG source stays in `assets/source/`, outside the production build; see [asset notes](assets.md) for local regeneration and measurements.

An optional absolute `http://` or `https://` `url` enables the detail view's “Visit resource” link. Content validation rejects malformed URLs, unsupported protocols, and embedded credentials; the renderer also ignores unsupported URLs defensively. The starter omits resource URLs because its items are illustrative. Keep private deployment content out of the public repository.

## Validate content

Run `npm run validate:content` after editing the collection. It also runs automatically before the development server starts and before each production build. It validates the JSON structure, required strings, unique item/category IDs, category references, real calendar dates, unique non-empty tags, safe resource URLs, accessible image descriptions, supported image styles, and the existence of image files in `public/`. Failures identify the offending field, such as `items[2].added`, and stop the build with a nonzero exit code. The current development server does not continuously validate content edits; rerun the command while editing.

IDs use lowercase letters, numbers, and single hyphens between words; category ID `all` is reserved. Category colors use three- or six-digit hex values. Image paths use letters, numbers, dots, hyphens, underscores, and slashes without traversal segments. Image `position` accepts one or two basic alignment keywords, percentages, or pixel values. Image `size` accepts `cover`, `contain`, or one or two `auto`, percentage, or pixel values.

## Share and restore a view

Use “Copy link” in the header to share a collection view, or inside details to share that item with the current filters. When clipboard access is unavailable, the button provides a selectable address for manual copying. URLs preserve their host, deployment subdirectory, and anchor. A localhost link only works on the machine running the preview; public sharing requires a separately configured static host.

| Parameter | Meaning | Default |
| --- | --- | --- |
| `q` | Search text, capped at 200 characters | Empty |
| `category` | A category ID from the collection | All categories |
| `sort` | `title` for alphabetical order | Recently added |
| `view` | `favorites` for this browser's favorites | All items |
| `item` | A valid item ID to open its details | No detail open |

Default and unknown parameters are removed. Invalid IDs and unsupported values fall back safely; duplicate parameters use their first value. An existing item can open even when the current filters exclude it. Sharing the favorites view never transfers the saved favorite IDs: another browser still uses its own local favorites.

Search edits form one history entry until the field loses focus. Category, view, and sort choices create discrete entries; repeated selections create none. Back and Forward restore filters and detail visibility. Closing a detail opened inside the app goes back to its collection view, so Forward can reopen it. Closing a directly loaded shared detail removes only `item` and stays in the collection.

## Interaction and access

Press `/` outside an editable field to focus search. All navigation and cards are keyboard operable. Details use a native modal dialog: Escape, the close button, or the backdrop dismisses it; focus returns to the triggering card when it remains present. Pointer activation explicitly focuses the card, and Tab/Shift+Tab cycle through enabled dialog controls to accommodate engine differences in button focus. Reduced-motion settings disable decorative transitions. Favorites are independently operable from opening a card.

## Static hosting

`npm run build` produces static files in `dist/`; `base: './'` keeps bundled paths relative for subdirectory hosting. There is no client-side route fallback requirement. Any static host that serves the directory can be used. This milestone does not configure or publish a deployment.

To inspect the same subdirectory setup used by the production tests:

```sh
npm run build
npm run preview:subpath
```

Open `http://127.0.0.1:4175/collections/card-things/`. The server binds only to loopback and is a local verification tool. A deployed host must serve the directory index and redirect the bare directory URL to its trailing-slash form while preserving the query string.

## Current boundaries

Content is edited in JSON, not in an in-app editor. Favorites do not sync across tabs or devices. The collection is small and loaded at build time; pagination, import/export, and very large collections are future work. Validation happens before building; this app does not fetch unvalidated content from a server at runtime. No additional backend or framework is required for this milestone.
