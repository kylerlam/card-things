# Sample asset notes

`assets/source/collection-covers.png` is the original image generated for this CardThings prototype using the built-in Image Gen tool. It contains six cells in a three-column, two-row sprite: a green pleated ribbon, peach architectural arch, lavender sample book, orange paper study, blue geometric forms, and green leaves.

The app serves the locally encoded `public/images/collection-covers.webp` derivative. Both images are 1942 × 809 pixels; the CSS positions, dimensions, and crops are unchanged. The original PNG is retained outside `public/` so it remains editable without being copied into the static build.

The prompt requested matching studio-lit editorial cover images, no external logos, no watermarks, and no interface text. The sample book's words are part of the generated cover. The artwork illustrates fictional example entries and does not imply a real product, endorsement, or licensed third-party collection.

The app loads this image locally. There are no external image or font requests. Images are optional: an item without `image` gets a category-colored text cover with no network request. To use your own images, place them under `public/`, update the collection data, and remove the optional sprite `size` and `position` fields. Use only images you have permission to publish, and describe their content in the `alt` field.

The favicon and interface icons are small code-native SVGs. Fonts use locally available system sans-serif and Georgia fallbacks. No icon or font CDN is used.

## Local image optimization

The derivative was encoded locally with Pillow 12.3.0 and libwebp 1.6.0, using WebP quality 95 and method 6. No compression service or paid dependency is required. The checked-in derivative is used directly by the normal application build; Pillow is only needed to regenerate artwork.

```sh
python3 - <<'PY'
from PIL import Image

with Image.open('assets/source/collection-covers.png') as source:
    source.convert('RGB').save(
        'public/images/collection-covers.webp',
        format='WEBP', quality=95, method=6,
    )
PY
```

| Encoding evaluated | Bytes | Reduction from PNG | RGB PSNR against source |
| --- | ---: | ---: | ---: |
| Original PNG | 2,384,451 | — | Identical source |
| Lossless WebP | 1,556,750 | 34.71% | Pixel-identical |
| WebP quality 90 | 212,848 | 91.07% | 40.49 dB |
| **WebP quality 95 (selected)** | **353,388** | **85.18%** | **42.17 dB** |
| AVIF quality 90 | 290,192 | 87.83% | 42.14 dB |

Quality 95 WebP preserves more source detail than the smaller quality 90 WebP while removing about 2 MB from the initial image request. PSNR is an objective error measure, not proof of perceptual equivalence. This is a lossy derivative: the original stays available for future edits. Visual checks compare book lettering, fine ribbon folds, paper texture, leaves, and gradients at native resolution and in the rendered card and detail views.

At the image-optimization milestone, the production directory shrank from 2,639,838 to 608,787 bytes (76.94%). The image is shared by all twelve cards and details. Regression checks enforce a 400,000-byte budget for this sample atlas and confirm the source PNG is not served by the production site.

## Controlled first-load measurements

Measured on 2026-10-08 against the production build at baseline commit `f740f6d` and the WebP change. Each build was served by the same local HTTP server at the identical `/collections/card-things/` URL. The host was macOS ARM64, with Playwright Chromium 156.0.8078.4 in headless mode. Browser plugin not available; the existing Playwright workflow was used.

CDP simulation used 200,000 bytes/s download (1.6 Mbps), 93,750 bytes/s upload (0.75 Mbps), 150 ms latency, and 4× CPU slowdown. Each navigation used a fresh isolated context with the browser cache disabled. There were five navigations per build at each viewport, alternating build order between repetitions: twenty measured navigations total. No other task-owned browser tests ran during the measurement. Desktop was 1440 × 1000 at device scale factor 1; mobile used the Pixel 7 preset with a 390 × 844 viewport.

| Metric | Original PNG | WebP quality 95 |
| --- | ---: | ---: |
| Desktop LCP median | 13.784 s | 3.660 s |
| Desktop LCP range, 5 runs | 13.780–13.788 s | 3.636–3.668 s |
| Mobile LCP median | 13.780 s | 3.652 s |
| Mobile LCP range, 5 runs | 13.764–13.796 s | 3.644–3.656 s |
| Desktop first contentful paint median | 1.728 s | 1.736 s |
| Mobile first contentful paint median | 1.728 s | 1.720 s |
| Observed layout-shift sum, every run | 0 | 0 |

The cover was the observed largest-contentful-paint element in all twenty runs. Median LCP improved by about 73% at both viewports; text first-paint times were effectively unchanged. All runs completed without captured JavaScript runtime errors. Resource sizes above are actual file byte counts, independent of browser timing entries. One optimized desktop run omitted the image's Resource Timing entry, so whole-page transferred-byte aggregates are not inferred from that API.

These are repeated local synthetic measurements, not real-user metrics, a production-host benchmark, or physical-device performance. The test server used uncompressed HTTP on loopback with `no-store`; it did not model TLS, CDN behavior, warm caches, or background mobile workloads. CPU throttling is relative to this machine. The observed improvement does not establish field performance thresholds.

## Visual and functional verification

Before/after desktop and mobile checks confirm identical geometry and CSS crop coordinates for all twelve cards and the book-detail cover. The original and derivative were visually inspected at native resolution, followed by rendered card-wall and book-detail screenshots. Book lettering, image edges, and fine textures remain legible at the existing display sizes. The detail opens, its actions remain reachable by scrolling, and Escape restores card focus.

The affected collection and static-hosting suites passed all 80 cases across desktop and mobile Chromium, desktop Firefox, and desktop and mobile WebKit, with no failures, skips, or retries. They verify image loading and decoding, filters, sorting, favorites, keyboard and pointer details, responsive overflow, axe checks, console health, shared-detail refreshes, and subdirectory assets. Production build/content validation, TypeScript, and formatting checks also passed. Run the affected tests with:

```sh
npm run test:static -- tests/collection.spec.ts tests/static-deployment.spec.ts --workers=3
npm run format:check
```

Physical-device visual quality and deployed-host measurements remain unverified.
