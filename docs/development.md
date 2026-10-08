# Development and content guide

## Scope

This first experimental milestone is a static collection browser. It includes responsive navigation, a card wall, search, one category filter at a time, title or date sorting, item details, and browser-local favorites. Search, category, and favorites filters compose together. Search matches every whitespace-separated term, case-insensitively, across title, description, details, category, and tags.

The example collection is illustrative. It does not represent real tools, endorsements, personal collections, or a connected service. There is no account, backend, database, tracking, paid API, or remote font. Favorites stay in this browser, use the versioned `cardthings:favorites:v1` key, and do not sync between devices. If storage is unavailable, favorites still work for the current visit with an explanatory status message.

## Run and verify

Use Node.js 22.14 or later in the 22.x line and npm. The clean-copy checks used Node.js 22.14.0 and npm 11.2.0. The validation and subpath-preview scripts rely on Node's built-in TypeScript stripping. No separate global TypeScript installation is required.

```sh
npm ci
npm run dev
```

Keep the server running while viewing its printed URL. Stop it with Ctrl+C before running the following commands in the same terminal:

```sh
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

Run the full browser suite against the bundled sample before customizing it. Its expected titles, category labels, item counts, and sample-atlas budget describe that dataset. After replacing the content, adapt the browser expectations to your collection; a failed demo-title assertion does not mean your valid collection cannot run. `npm run validate:content` and `npm run build` always check your current content. Stop previews on ports 4173 and 4175 before running the corresponding suites.

The schema checks use independent fixtures and also validate the current collection. They still run after replacing the sample with a single card or an empty collection, without downloading browsers:

```sh
npm test -- --project=content
```

`npm run format:check` checks the application, validation script, test, and configuration files. `npm run format` formats those files without rewriting the existing project policy documents.

If a hand-edited JSON or source file fails the formatting check, run `npm run format`, review the changes, and rerun the check. A formatting failure is separate from content validation.

## Replace the collection

Edit `src/content/collection.json`; presentation components live separately in `src/components`, shared behavior in `src/lib`, and design tokens and responsive styles in `src/styles.css`.

The collection has:

- `title` and `description`: the main heading and introduction.
- `example`: keep `true` for the supplied sample data; set `false` only after replacing it with your own collection.
- `categories`: entries with unique `id`, visible `label`, and CSS `color`.
- `items`: entries conforming to `CollectionItem` in `src/lib/types.ts`.

Each item needs a unique stable `id`, `title`, a `category` matching a category ID, `description`, `details`, `tags`, an ISO `YYYY-MM-DD` `added` date, and an `image`. Image `src` is relative to `public/`, without a leading slash; give it a meaningful `alt`. Ordinary image files need only `src` and `alt`; optional CSS `position` and `size` support art direction. The starter uses six generated covers in one local WebP sprite, reused across twelve entries. Its editable PNG source stays in `assets/source/`, outside the production build; see [asset notes](assets.md) for local regeneration and measurements.

An optional absolute `http://` or `https://` `url` enables the detail view's “Visit resource” link. Content validation rejects malformed URLs, unsupported protocols, and embedded credentials; the renderer also ignores unsupported URLs defensively. The starter omits resource URLs because its items are illustrative. Keep private deployment content out of the public repository.

### Start with one card

Replace the entire contents of `src/content/collection.json` with the following valid starting point. It uses the repository's existing `public/favicon.svg` as a temporary cover, so you can verify the edit before adding an image. This tutorial entry remains explicitly labeled as example content.

```json
{
  "title": "Studio Shelf",
  "description": "Notes and resources for my creative work.",
  "example": true,
  "categories": [
    { "id": "notes", "label": "Notes", "color": "#234e70" }
  ],
  "items": [
    {
      "id": "first-note",
      "title": "My first note",
      "category": "notes",
      "description": "A short introduction to this entry.",
      "details": "Replace this paragraph with your own context or notes.",
      "tags": ["Personal"],
      "added": "2026-10-08",
      "image": {
        "src": "favicon.svg",
        "alt": "Two overlapping rectangular cards"
      }
    }
  ]
}
```

Run `npm run validate:content`; expect `Collection valid: 1 items, 1 categories.` Then run `npm run dev` and check that the heading, Notes category, one card, and its details appear.

To use your own cover, copy a supported browser image, such as a WebP, PNG, JPEG, or SVG, into `public/images/my-cover.webp` using its actual extension. Change `image.src` to `images/my-cover.webp` and describe that image in `image.alt`. The starting point above already omits sprite-specific `size` and `position`; keep them omitted for ordinary centered covers. Run validation again. File paths are case-sensitive on many hosts, so match the filename exactly.

To add a category, add an object to `categories` with a unique lowercase hyphenated `id`, its visible `label`, and a three- or six-digit hex `color`. Set each card's `category` to that ID. To add a card, copy the complete item object, assign a unique stable `id`, and replace its text, date, tags, and image. An empty tag list `[]` is allowed. IDs appear in shared links and saved favorites, so avoid changing an established ID unnecessarily.

To link a card to a real resource, add an optional `"url": "https://example.com/"` field to the item, replacing the demonstration address with your own HTTP(S) URL. Omit the field entirely when there is no resource link. After replacing the tutorial text and artwork with your own content, set the top-level `example` to `false` to remove the example badge and detail disclaimer. This flag does not change the app's brand name.

### Change the brand

Collection content and application branding currently have separate entry points. There is no central brand configuration or in-app brand editor. For a small rename such as “Studio Shelf,” make these existing source edits:

| Surface | File and exact entry point |
| --- | --- |
| Collection heading and introduction | `title` and `description` in `src/content/collection.json` |
| Visible wordmark and its two-card symbol | The `Brand()` component in `src/components/Icon.tsx`; replace `<span>CardThings</span>` and edit the adjacent SVG only if needed |
| Accessible home-button name, sidebar tagline, repository link | `aria-label="CardThings home"`, the footer paragraph, and the GitHub `href` in `src/components/Sidebar.tsx` |
| Bottom-page copy | The `collection-footer` in `src/App.tsx`, including “Made with CardThings” |
| Collection name inside non-example details | The `'CardThings'` fallback in `src/components/ItemDialog.tsx` |
| Browser tab title, page description, browser theme color | `<title>`, `meta name="description"`, and `meta name="theme-color"` in `index.html` |
| Browser tab icon | `public/favicon.svg`; preserve that filename or also update its link in `index.html` |
| Base colors and heading font | The `:root` variables in `src/styles.css`, especially `--green`, `--bg`, `--ink`, and `--serif` |

For the minimal rename, update the wordmark, home-button label, browser title, and non-example detail label together; review the two footers and metadata for the wording you want. Keep the collection heading independent if it should differ from the brand. Category colors still come from JSON, and some heading, logo, focus, and hover colors are explicit CSS values, so changing `--green` alone is not a complete theme system.

After edits, run validation and a production build, open a card with `example: false`, and check both a desktop and a narrow browser window. Verify the browser title, visible wordmark, home-button name, detail label, and footer; confirm longer names fit. Rebuild whenever you want the production preview to reflect source changes.

### A short check after customization

1. Confirm the heading, category labels/counts, covers, and detail text match your JSON.
2. Search for a word in your card, filter its category, and sort by title.
3. Open details, save a favorite, close with Escape, and reload. Test favorites on the same host and port because browser storage is origin-specific.
4. Copy a detail link, open it in another tab, refresh, and close the details. Check that the item and filters restore.
5. Check a narrow window for horizontal overflow and use Tab to reach the main controls.

If an edit is rejected, fix the named field or missing `public/` image and rerun validation. If a preview shows old content, stop it, run `npm run build`, and restart it. If a port is occupied, stop the server you started or follow Vite's printed URL; the fixed subpath preview requires port 4175 to be free.

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
