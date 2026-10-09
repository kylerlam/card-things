# Development and content guide

## Scope

This experimental frontend is a static collection browser with optional browser-local collection data. It includes responsive navigation, a card wall, search, one category filter at a time, title or date sorting, item details, guided collection settings and card editing, browser-local favorites, a downloadable starter, and validated JSON import/export. Items may use local images or generated text covers. Search, category, and favorites filters compose together. Search matches every whitespace-separated term, case-insensitively, across title, description, details, category, and tags.

The example collection is illustrative. It does not represent real tools, endorsements, personal collections, or a connected service. There is no account, backend, database, tracking, paid API, or remote font. Favorites use the versioned `cardthings:favorites:v1` key, and the browser collection uses the separate versioned `cardthings:collection:v1` key. Imports and guided card changes synchronize across other open tabs on the same origin, but not between browsers or devices. If storage is unavailable, favorites and collection changes still work for the current visit with an explanatory status message.

## Run and verify

Use Node.js 22.14 or later in the 22.x line and npm. The clean-copy checks used Node.js 22.14.0 and npm 11.2.0. The validation and subpath-preview scripts rely on Node's built-in TypeScript stripping. No separate global TypeScript installation is required.

```sh
npm ci
npm run dev
```

Keep the server running while viewing its printed URL. Stop it with Ctrl+C before running the following commands in the same terminal:

```sh
npm run validate:brand
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

The default test runner starts or reuses `http://127.0.0.1:4173`. The content project tests validation rules and CLI failures; five browser projects cover desktop Chromium, mobile Chromium, desktop Firefox, desktop WebKit, and mobile WebKit. Tests exercise guided collection settings and card editing, invalid and cancelled drafts, stable category and card IDs, local image preflight, stable links and favorites, search/filter combinations, empty states, sorting, starter download and zero-asset import, exact export, two-tab collection and favorite synchronization, malformed external values, storage removal and unavailability, repeated dialog operations, focus return, keyboard navigation, responsive overflow, network requests, console health, automated axe checks, share links, refresh, history navigation, invalid URL parameters, and clipboard fallback.

`npm run test:static` builds the production files, starts a local static server on port 4175, and reruns all browser cases under `/collections/card-things/`. It also checks mounted assets, query and anchor preservation, direct refreshes, the directory redirect, and explicit `index.html` URLs. This server has no SPA fallback or root-level application assets. Port 4175 must be free before running this command.

These are isolated Playwright browsers, not personal browser profiles. Mobile emulation is not physical-device validation, and Playwright WebKit is not the installed Safari app. See [compatibility verification](compatibility.md) for the tested versions, results, clipboard limits, and known coverage gaps.

Run the full browser suite against the bundled sample before customizing it. Its expected titles, category labels, item counts, and sample-atlas budget describe that dataset. After replacing the content, adapt the browser expectations to your collection; a failed demo-title assertion does not mean your valid collection cannot run. `npm run validate:content` and `npm run build` always check your current content. Stop previews on ports 4173 and 4175 before running the corresponding suites.

The content and brand schema checks use independent invalid fixtures and also validate the current configuration. They still run after replacing the sample with a single card or an empty collection, without downloading browsers:

```sh
npm test -- --project=content
```

`npm run format:check` checks the application, validation script, test, and configuration files. `npm run format` formats those files without rewriting the existing project policy documents.

If a hand-edited JSON or source file fails the formatting check, run `npm run format`, review the changes, and rerun the check. A formatting failure is separate from content validation.

## Add and edit cards in the browser

Choose **Add card** in the page header to create one entry without editing JSON. Open an existing card and choose **Edit card** to update it. The form includes every ordinary card content field: title, existing category, short description, details, comma-separated tags, date, optional resource link, and optional local image path and description.

New IDs are generated from the title and made unique. Editing preserves the existing ID, shared detail link, favorite, and any bundled image art direction when its path stays unchanged. The first saved form change creates a browser-local, non-example copy of the active collection. Saving clears active search and category filters only when revealing a newly created card; editing returns to the same detail. Cancelling never mutates collection data.

Leaving both cover fields empty creates a generated cover. A supplied image must pass the same safe relative-path validation and same-site loading check as an imported collection before the card can be saved. Resource links accept absolute HTTP(S) addresses without embedded credentials. Inline messages identify invalid fields and focus the first one needing attention.

The card editor intentionally does not create categories, delete cards, upload image bytes, or publish a site. Use the collection settings flow for collection copy and category additions or appearance, and JSON for unsupported bulk changes. Saved cards use the same browser storage and cross-tab update path as imports, and remain available for the visit with a warning when storage is unavailable.

## Edit collection settings in the browser

Open **Collection data**, then choose **Collection settings**. The form changes the visible collection title and description, category names, and category colors, and can add a category. Color controls combine a native picker with an editable three- or six-digit hex value. The same schema used for JSON validates the whole result before it becomes active.

Existing category IDs are read-only. Renaming “Tools” to “Utilities,” for example, leaves its `tools` ID, assigned cards, active category URL, and saved favorites unchanged. A new category gets a unique lowercase ID from its initial name; editing its visible name later in the same draft does not rewrite that ID. Category removal is not offered, so a settings edit cannot detach populated cards. Cancelling or pressing Escape discards the whole draft.

Saving creates a browser-local, non-example collection through the same storage and cross-tab path as card editing and import. Active valid filters and details remain in place. When browser storage is unavailable, the settings still apply for the current visit and the page explains the limitation. Site name, metadata, theme, and favicon remain static code configuration in `src/content/brand.ts` rather than browser collection data.

## Import and export in the browser

Open **Collection data** in the page header to move a collection without rebuilding the site:

1. Use **Starter JSON** to download a valid one-card collection. Edit its text in any plain-text editor; it needs no image file.
2. Choose a `.json` file up to 1 MB. The browser runs the same structural validation used by the build, then loads each referenced local image from the current site before changing anything. Invalid files or unavailable images leave the active collection and URL state untouched and list the failing fields.
3. A valid import becomes active immediately and is saved only in this browser. Search and category filters reset; the current sort choice remains. Reloading the same origin restores the imported collection.
4. Use **Export** to download the exact active collection. Favorites are browser state and are intentionally excluded.
5. Use **Restore bundled collection**, then confirm, to remove the browser collection and return to `src/content/collection.json`.

The `image` object is optional. Without it, CardThings creates a decorative text cover from the item title and category color, so a JSON file can be useful by itself. When `image` is present, it can reference only a safe local path: the JSON file does not contain image bytes, so `image.src` must already exist under the deployed site's `public/` directory. Runtime import validates the schema and path syntax, then verifies that every referenced path loads as an image from the same site. It never requests a remote image URL from imported data. A later loading failure in an active collection replaces the blank cover with an accessible “Image unavailable” fallback. The build-time validation command still checks referenced bundled image files directly. Imported data never leaves the device, and collection URLs do not embed or transfer it.

A card or settings edit, import, reset, favorite change, or storage clear is reflected in other open CardThings tabs on the same origin. The receiving tab shows a plain-language status. Search, sort, and the favorites view remain active; a category or open detail that does not exist in the new collection is removed from the URL so the page remains usable. Settings that were already open are not saved after another tab changes the collection; cancel and reopen the form to review the latest version. Invalid JSON or an invalid stored shape from another tab is ignored without replacing the current state. If saved collection or favorite data cannot be read at startup, CardThings shows the bundled or empty fallback with an explicit warning and leaves the unreadable stored value unchanged. Storage-event handlers update memory only and do not write the received value back, preventing feedback loops.

## Rendered version previews

The current screenshots live in [`docs/previews/`](previews/README.md) with stable filenames so each Git commit preserves its matching UI evidence. They cover the main collection, guided editor, and collection settings at 1440 × 1000 and 390 × 844, the desktop item-detail and collection-data dialogs, the zero-asset starter, rejected missing-image feedback, same-origin tab synchronization, the mobile empty-favorites state, and the runtime image fallback.

Install Chromium once with `npx playwright install chromium`. Then start the exact local capture target in one terminal:

```sh
npm run dev -- --port 4173 --strictPort
```

In a second terminal, regenerate the tracked images from the rendered application:

```sh
npm run capture:previews
```

Set `CARDTHINGS_PREVIEW_URL` only when intentionally capturing another already-running origin. Review every regenerated image before committing it with the matching code. The script clears its isolated browser storage and does not use a personal browser profile.

## Replace the collection

Edit `src/content/collection.json`; presentation components live separately in `src/components`, shared behavior in `src/lib`, and design tokens and responsive styles in `src/styles.css`.

The collection has:

- `title` and `description`: the main heading and introduction.
- `example`: keep `true` for the supplied sample data; set `false` only after replacing it with your own collection.
- `categories`: entries with unique `id`, visible `label`, and CSS `color`.
- `items`: entries conforming to `CollectionItem` in `src/lib/types.ts`.

Each item needs a unique stable `id`, `title`, a `category` matching a category ID, `description`, `details`, `tags`, and an ISO `YYYY-MM-DD` `added` date. Omit `image` for a generated text cover. To use a local image, set `image.src` relative to `public/`, without a leading slash, and give it a meaningful `alt`. Ordinary image files need only `src` and `alt`; optional CSS `position` and `size` support art direction. The bundled demo uses six generated images in one local WebP sprite, reused across twelve entries. Its editable PNG source stays in `assets/source/`, outside the production build; see [asset notes](assets.md) for local regeneration and measurements.

An optional absolute `http://` or `https://` `url` enables the detail view's “Visit resource” link. Content validation rejects malformed URLs, unsupported protocols, and embedded credentials; the renderer also ignores unsupported URLs defensively. The starter omits resource URLs because its items are illustrative. Keep private deployment content out of the public repository.

### Start with one card

Replace the entire contents of `src/content/collection.json` with the following valid starting point. It needs no image asset; CardThings generates a text cover from “My first note” and the Notes category color. This tutorial entry remains explicitly labeled as example content.

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
      "added": "2026-10-08"
    }
  ]
}
```

Run `npm run validate:content`; expect `Collection valid: 1 items, 1 categories.` Then run `npm run dev` and check that the heading, Notes category, one card, and its details appear.

To use your own cover, copy a supported browser image, such as a WebP, PNG, JPEG, or SVG, into `public/images/my-cover.webp` using its actual extension. Add `"image": { "src": "images/my-cover.webp", "alt": "Describe the visible cover" }` to the item. Optional `size` and `position` fields are only needed for art direction such as the bundled sprite. Run validation again. File paths are case-sensitive on many hosts, so match the filename exactly.

To add a category, add an object to `categories` with a unique lowercase hyphenated `id`, its visible `label`, and a three- or six-digit hex `color`. Set each card's `category` to that ID. To add a card, copy the complete item object, assign a unique stable `id`, and replace its text, date, and tags; add `image` only when needed. An empty tag list `[]` is allowed. IDs appear in shared links and saved favorites, so avoid changing an established ID unnecessarily.

To link a card to a real resource, add an optional `"url": "https://example.com/"` field to the item, replacing the demonstration address with your own HTTP(S) URL. Omit the field entirely when there is no resource link. After replacing the tutorial text and artwork with your own content, set the top-level `example` to `false` to remove the example badge and detail disclaimer. This flag does not change the app's brand name.

### Change the brand

Edit **`src/content/brand.ts`** for site identity, page metadata, and theme colors. This is the single brand configuration entry point; do not rename labels in individual components or add duplicate metadata to `index.html`.

The file ends with `satisfies BrandConfig`, which gives editor completion and compile-time checks for field names, value types, and required theme tokens. Keep that annotation. Runtime validation also rejects empty text, malformed colors, unknown fields, unsafe repository URLs, invalid favicon paths, and missing favicon files.

| Setting | Where it appears |
| --- | --- |
| `name` | Wordmark, accessible home-button name, footer attribution, non-example detail label, and example disclaimer |
| `tagline` | Sidebar footer |
| `footerNote` | Bottom-page note |
| `repositoryUrl` | Sidebar GitHub link; use an absolute HTTP(S) URL without credentials |
| `metadata.title` and `metadata.description` | HTML title and description, present before client JavaScript runs |
| `favicon` | Local icon path relative to `public/`, with a lowercase `.svg`, `.png`, or `.ico` extension |
| `theme.accent` | Main buttons, selected filters, links, detail headings, saved favorites, and the browser's `theme-color` metadata |
| `theme['brand-mark']`, `theme['brand-text']`, `theme.heading` | Wordmark symbol, wordmark text, and collection heading |
| `theme['accent-hover']`, `theme['focus-ring']`, `theme['focus-border']`, `theme['focus-shadow']` | Button hover and keyboard/search focus states |
| Remaining `theme` entries | Backgrounds, surfaces, text, borders, shadows, and element-specific interaction colors; names describe their role |

The default title and description interpolate the local `name` variable, so changing `const name = 'CardThings'` updates those mentions too. Customize the surrounding wording in `metadata` as needed. Collection headings and category colors remain in `collection.json`; they describe content, independently of the site brand.

For a small blue “Studio Shelf” variation, change the name and these existing values in the file, leaving the other tokens in place:

```ts
const name = 'Studio Shelf';

// Inside the existing configuration:
tagline: 'Notes and tools, together.',
footerNote: 'A shelf for everyday work.',
metadata: {
  title: `${name} — Notes & resources`,
  description: `Explore ${name}: notes, tools & ideas for creative work.`,
},
// Inside the existing theme object:
accent: '#234e70',
'accent-hover': '#17354d',
'brand-mark': '#234e70',
'brand-text': '#142b40',
heading: '#142b40',
'focus-ring': '#397fba',
'focus-border': '#397fba',
'focus-shadow': '#234e701a',
'nav-active': '#e8eff7',
```

This is an edit guide, not a complete replacement file. Review the remaining state/background colors in the same `theme` object when designing a full palette. Colors use three-, six-, or eight-digit hex notation; eight digits can encode opacity for shadows and overlays. Valid syntax does not guarantee sufficient contrast, so run the accessibility checks after a palette change. Layout and fonts still live in `src/styles.css`.

The favicon and cover images are assets: theme colors do not recolor their pixels. To use a different icon, put it in `public/` (for example `public/images/studio-favicon.svg`) and set `favicon: 'images/studio-favicon.svg'`. The favicon path is checked before development or building and remains relative under subdirectory hosting.

Run:

```sh
npm run validate:brand
npm run build
npm run preview
```

`validate:brand` also runs automatically before development startup and production builds. A failure names the field, such as `brand.theme.accent: must be a three-, six-, or eight-digit hex color`, and exits unsuccessfully; missing required properties also fail TypeScript during the build. Fix the configuration before continuing. Metadata text is escaped when rendered into HTML, and color values cannot inject CSS.

Restart the development server after brand edits so the server-generated metadata, theme, and client content all read the same configuration. Rebuild before checking production preview. Verify the wordmark, browser title/description, focus and hover states, and a detail with `example: false` at desktop and mobile sizes. For the brand checks only (installed Playwright browsers required):

```sh
npm test -- tests/brand.spec.ts
```

The original default theme preserves all existing color values. This configuration provides static customization; it does not add an editor, theme switcher, account, or backend.

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

The browser workspace edits cards, collection copy, and category additions or appearance. It intentionally does not remove categories or cards, upload image bytes, or change site branding and metadata. Favorites and collection changes sync between open tabs on the same origin, but not between browsers or devices. The collection remains small and fully client-side; pagination and very large collections are future work. Bundled content is validated before building, and runtime changes are validated before activation. The app does not fetch collection data from a server. No additional backend or framework is required for this milestone.
