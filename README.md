# CardThings

A small collection browser built with React, TypeScript, and Vite. Browse cards, search, filter by category, sort, save browser-local favorites, and share a filtered view or an item's details. The included twelve entries are fictional example content.

This experimental frontend currently lives on `feat/freya-collection-v1`. The default `main` branch still contains the initial documentation, so use the branch in the command below to try the app.

## Quick start

You need Git, Node.js 22.14 or later in the 22.x line, and npm. The verified setup is Node.js 22.14.0 with npm 11.2.0. Installation needs access to GitHub and the npm registry; running the app needs no account, API key, `.env` file, backend, or paid service.

In a terminal, clone into a new directory:

```sh
git clone --branch feat/freya-collection-v1 --single-branch https://github.com/kylerlam/card-things.git
cd card-things
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173/`. Keep that terminal running. You should see “Good things, kept together.” and twelve cards. Try searching for `Orbit`, open the card, and press Escape to return. Stop the server with **Ctrl+C** before continuing in the same terminal.

If the folder already exists, choose a different clone directory; do not overwrite an existing checkout. Run all commands below from the directory containing `package.json`.

## Make it your collection

1. Edit `src/content/collection.json`: change the collection heading and introduction, define categories, and replace the card entries. Every card's `category` must match a category `id`. Start with the [complete one-card example](docs/development.md#start-with-one-card), which needs no additional files.
2. Put your own covers in `public/images/`. In JSON, use a path such as `images/my-cover.webp`, without `public/` or a leading slash. Remove the starter sprite's `size` and `position` when using an ordinary image, and provide useful `alt` text. Set `example` to `false` after replacing the tutorial data with your own content.
3. Use the [branding file map](docs/development.md#change-the-brand) to update the wordmark, browser title, home-button label, footer, and detail label. These are existing source edits; changing the collection heading alone does not rename the app.
4. Run `npm run validate:content`, then rebuild and preview. Validation identifies invalid fields and missing images. Keep private data and credentials out of the source and covers.

Content is edited in files. There is no in-app editor or account system. Favorites stay in the current browser and origin; they do not sync between devices. Shared links carry filters and item IDs, not saved favorites.

## Build and preview locally

After stopping the development server:

```sh
npm run validate:content
npm run build
npm run preview
```

Open the URL printed by Vite, usually `http://127.0.0.1:4173/`. `build` validates the content, checks TypeScript, and writes `dist/`; `preview` serves that existing build. Rebuild after editing source or content. Do not open `dist/index.html` directly as a `file://` URL.

To inspect the built files under a real local subdirectory instead, stop the preview and run:

```sh
npm run preview:subpath
```

Open `http://127.0.0.1:4175/collections/card-things/`. This command also requires an existing build and a free port 4175. Both previews bind to loopback. A localhost share link works only on the machine running the server. No public deployment, hosting account, or release is configured by these commands.

## Checks

After any content edit:

```sh
npm run validate:content
npm run build
npm run format:check
```

If formatting fails after a manual edit, run `npm run format`, review its changes, and retry. Schema checks also work with a customized collection: `npm test -- --project=content` (no browser download required).

For the bundled example's automated browser checks, stop local previews first:

```sh
npx playwright install chromium firefox webkit
npm test
npm run test:static
```

Browser installation is optional for running the app. The full browser suite expects the bundled demo's titles, categories, images, and counts; adapt those expectations for your own dataset. The [development guide](docs/development.md#run-and-verify) explains validation tests and test ports.

See the [development and content guide](docs/development.md), [asset and performance notes](docs/assets.md), and [compatibility results](docs/compatibility.md) for the implementation's verified behavior and current limits.
