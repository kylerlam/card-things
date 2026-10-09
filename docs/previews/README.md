# Rendered previews

These images are captured from the running CardThings application and committed with the code they represent. Stable filenames let Git history show the matching interface at any reviewable commit.

## Collection — desktop

1440 × 1000 Chromium viewport.

![CardThings collection at desktop width](collection-desktop.png)

## Collection — mobile

390 × 844 Chromium viewport. The navigation, toolbar, and cards use the mobile layout.

![CardThings collection at mobile width](collection-mobile.png)

## Item details

1440 × 1000 Chromium viewport with the Orbit Studio detail dialog open.

![CardThings item detail dialog](item-detail-desktop.png)

## Collection data

1440 × 1000 Chromium viewport with the local import and export dialog open.

![CardThings collection data dialog](collection-data-desktop.png)

## Empty favorites — mobile

390 × 844 Chromium viewport showing the actionable empty state.

![CardThings empty favorites state at mobile width](favorites-empty-mobile.png)

## Regenerate

From the repository root, install Chromium once, start the fixed local server, and run the capture script in a second terminal:

```sh
npx playwright install chromium
npm run dev -- --port 4173 --strictPort
```

```sh
npm run capture:previews
```

The script targets `http://127.0.0.1:4173/` by default, clears storage in its isolated browser pages, and overwrites these stable files. It captures the current rendered UI; it does not generate or compose mockups. Review all five images before committing them with the corresponding frontend change.
