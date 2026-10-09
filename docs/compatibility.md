# Compatibility verification

Verified on macOS ARM64 on 2026-10-09 using Node.js 22.14 and Playwright 1.64.0. The checks use official Playwright browser builds in isolated profiles.

## Coverage

| Project | Engine version | Viewport / emulation | Development root | Production subdirectory |
| --- | --- | --- | --- | --- |
| Desktop Chromium | 156.0.8078.4 | 1440 × 1000 | 47 passed | 51 passed |
| Mobile Chromium | 156.0.8078.4 | Pixel 7 preset, 390 × 844 | 47 passed | 51 passed |
| Desktop Firefox | 157.0 | 1440 × 1000 | 47 passed | 51 passed |
| Desktop WebKit | 27.2 | 1440 × 1000 | 47 passed | 51 passed |
| Mobile WebKit | 27.2 | iPhone 13 preset, 390 × 664 | 47 passed | 51 passed |

The development run also passes 23 content and 16 brand validation cases: 274 total. The production matrix passes 255 browser cases. The final development run and final per-project production runs have zero failures, skips, or retries. Production testing includes fresh brand/content validation, a TypeScript check, and a Vite build. Production projects were run in clean engine invocations after a cumulative host-memory stall in a combined attempt; the application, configuration, and assertions were unchanged between those final project runs.

Every browser project exercises guided collection settings and card editing, cancelled and repeated drafts, field validation, stable category/card IDs, links and favorites, storage failures, two-tab synchronization, search, combined filters, sorting, malformed external values, removal and clear behavior, feedback-loop prevention, starter download and zero-asset import, generated card/detail covers, same-site image preflight, unchanged state after a rejected image, runtime image fallback, exact JSON export, import persistence, confirmed reset, dialogs, pointer and keyboard interactions, responsive overflow, automated axe accessibility checks, console health, network requests, URL normalization, refresh, Back/Forward, share links, and manual clipboard fallback. Narrow-layout cases include both editors at a 320px viewport.

## Brand configuration verification

Brand checks cover initial HTML metadata and theme values with JavaScript disabled, visible identity, detail labels, real control colors, focus states, and desktop hover states. An isolated copy with a blue Studio Shelf palette, alternate metadata/favicon, and `example: false` passed 15 focused development checks in the earlier milestone. The default collection and palette remain in the repository.

Default desktop and mobile collection/detail captures retained identical element geometry, colors, borders, outlines, and shadows after extraction into `src/content/brand.ts`. Three of four screenshots were pixel-identical; the desktop detail had 30 changed pixels out of 1,440,000 despite equal measured styles and geometry. Visual review found no layout or appearance regression.

Separate invalid-configuration probes confirmed that malformed colors stop both `npm run dev` and `npm run build`, missing favicon files stop builds, and a numeric brand name fails TypeScript. Errors identify the affected field. Syntax validation does not guarantee color contrast; the example alternate palette also passed the existing automated accessibility checks.

## Confirmed corrections

- WebKit pointer activation did not consistently focus the opening card. Closing details could therefore restore focus to the wrong element. Card activation now explicitly focuses its button before opening details.
- WebKit's default tab behavior skipped modal buttons. The dialog now handles Tab and Shift+Tab across its enabled controls, including wraparound. Tests check repeated opening, close-button and Escape dismissal, focus restoration, and keyboard favorite actions.
- Cross-engine clipboard tests initially requested Chromium-only permissions. Chromium still tests native clipboard write/read. Firefox and WebKit assert the exact write payload through a test stub, and a separate unmocked case verifies native completion or the selectable manual address. The final runs reported native write completion in all five projects; native clipboard byte readback was verified only in Chromium.
- An invalid-query test originally navigated to the site root. It now uses a relative URL so the identical behavior runs under either hosting base. This was a test fixture correction, not an application routing defect.
- React Strict Mode runs effect setup and cleanup twice during development. The collection-data dialog now resets its async cancellation ref during setup so a completed local-image preflight can update the mounted dialog while a genuinely closed dialog remains protected from late activation.

## Production hosting evidence

`npm run test:static` serves the built `dist/` directory only at `/collections/card-things/` through `scripts/serve-subpath.ts`. It does not use Vite's development server, root-level assets, or a SPA fallback. JavaScript, CSS, cover images, and the favicon load from the mount. Missing routes and root-level cover requests return 404.

The suite verifies shared detail refreshes, query and anchor preservation on close, a bare-directory redirect that retains its query, and explicit `index.html` URLs. The full browser suite also verifies copy links and history navigation under this real subdirectory. No public deployment or hosting account was configured.

## Reproduce

```sh
npm ci
npx playwright install chromium firefox webkit
npm test -- --workers=3
npm run test:static -- --workers=3
npm run format:check
```

If browsers are installed in a custom cache, set the same `PLAYWRIGHT_BROWSERS_PATH` for installation and execution. The static suite needs port 4175 free. For an interactive preview after the tests, run `npm run preview:subpath` and open `http://127.0.0.1:4175/collections/card-things/`.

## Limits and next evidence to collect

WebKit coverage is engine testing, not a claim of testing the installed Safari app or a physical iPhone. The mobile Chromium preset is not a physical Android test. Native browser permission prompts, OS clipboard readback outside Chromium, screen-reader interaction, and deployed CDN/cache behavior remain unverified. Automated axe checks do not replace a manual accessibility review.

The original 2,384,451-byte cover atlas prompted a subsequent local encoding and first-load investigation. See [asset notes](assets.md) for the selected derivative, measured results, and visual checks. Real-device and deployed-host performance remain separate validation work.
