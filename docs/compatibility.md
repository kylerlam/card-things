# Compatibility verification

Verified on macOS ARM64 on 2026-10-08 using Node.js 22.14 and Playwright 1.64.0. The checks use official Playwright browser builds in isolated profiles.

## Coverage

| Project | Engine version | Viewport / emulation | Development root | Production subdirectory |
| --- | --- | --- | --- | --- |
| Desktop Chromium | 156.0.8078.4 | 1440 × 1000 | 22 passed | 26 passed |
| Mobile Chromium | 156.0.8078.4 | Pixel 7 preset, 390 × 844 | 22 passed | 26 passed |
| Desktop Firefox | 157.0 | 1440 × 1000 | 22 passed | 26 passed |
| Desktop WebKit | 27.2 | 1440 × 1000 | 22 passed | 26 passed |
| Mobile WebKit | 27.2 | iPhone 13 preset, 390 × 664 | 22 passed | 26 passed |

The development run also passes 18 content validation cases: 128 total. The production run passes 130 browser cases. Both final runs have zero failures, skips, or retries. Production testing includes a fresh content validation, TypeScript check, and Vite build.

Every browser project exercises search, combined filters, sorting, favorites and storage failures, dialogs, pointer and keyboard interactions, responsive overflow, automated axe accessibility checks, console health, network requests, URL normalization, refresh, Back/Forward, share links, and manual clipboard fallback. Narrow-layout cases include a 320px viewport.

## Confirmed corrections

- WebKit pointer activation did not consistently focus the opening card. Closing details could therefore restore focus to the wrong element. Card activation now explicitly focuses its button before opening details.
- WebKit's default tab behavior skipped modal buttons. The dialog now handles Tab and Shift+Tab across its enabled controls, including wraparound. Tests check repeated opening, close-button and Escape dismissal, focus restoration, and keyboard favorite actions.
- Cross-engine clipboard tests initially requested Chromium-only permissions. Chromium still tests native clipboard write/read. Firefox and WebKit assert the exact write payload through a test stub, and a separate unmocked case verifies native completion or the selectable manual address. The final runs reported native write completion in all five projects; native clipboard byte readback was verified only in Chromium.
- An invalid-query test originally navigated to the site root. It now uses a relative URL so the identical behavior runs under either hosting base. This was a test fixture correction, not an application routing defect.

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

The local cover atlas is 2,384,451 bytes, substantially larger than the application bundles. A useful next step is to measure first-load behavior on a constrained network and compare an optimized image format while checking the existing crops and visual quality.
