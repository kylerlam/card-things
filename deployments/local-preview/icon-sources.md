# Local preview icon sources

Official artwork retrieved on 2026-10-25. The files in `public/tool-icons/` are served locally; `catalogue.json` selects them through each card's `iconUrl`. Configured icons bypass GitHub metadata requests. The existing automatic resolver remains available for unconfigured cards.

Prefer a clear, coloured application icon from the official source. Use an SVG or a raster of at least 256 pixels per side. Preserve the upstream design: Typora is monochrome, and Ventoy intentionally has soft gradients. GitHub account avatars and small favicons do not establish application icon quality.

| Application | Local file | Source quality | Official source |
| --- | --- | --- | --- |
| LocalSend | [`localsend.png`](../../public/tool-icons/localsend.png) | 512 x 512 | [Original artwork](https://raw.githubusercontent.com/localsend/localsend/530829acaf1c01861e884b980830b6ae0aff9164/app/assets/img/logo-512.png) |
| Maccy | [`maccy.png`](../../public/tool-icons/maccy.png) | 1024 x 1024 | [Original artwork](https://raw.githubusercontent.com/p0deje/Maccy/54fb9f00b828a4ec367e706c0e276df90febe76a/Maccy/Assets.xcassets/AppIcon.appiconset/AppIcon%20%28Big%20Sur%29-1024w.png) |
| Motrix | [`motrix.png`](../../public/tool-icons/motrix.png) | 512 x 512 | [Original artwork](https://raw.githubusercontent.com/agalwood/Motrix/29966d4df08638ae1e212ff24c16e0e16ae04456/public/app-icon.png) |
| OBS Studio | [`obs-studio.png`](../../public/tool-icons/obs-studio.png) | 512 x 512 | [Original artwork](https://raw.githubusercontent.com/obsproject/obs-studio/72e86655715d9a25d69ce446aa4dd44ba58e10d2/frontend/cmake/macos/Assets.xcassets/AppIcon.appiconset/icon_512x512.png) |
| OpenScreen | [`openscreen.png`](../../public/tool-icons/openscreen.png) | 1024 x 1024 | [Original artwork](https://raw.githubusercontent.com/getopenscreen/openscreen/6e09c9d18bea442bca1ae4a8e1d641cbc4d429d1/icons/icons/png/1024x1024.png) |
| Quota Float | [`quota-float.png`](../../public/tool-icons/quota-float.png) | 512 x 512 | [Original artwork](https://raw.githubusercontent.com/change-42-yhmm/quota-float/ecb30441036957ab8e55ddc7e4a7b9e50f27c77a/src-tauri/icons/icon.png) |
| RustDesk | [`rustdesk.png`](../../public/tool-icons/rustdesk.png) | 1024 x 1024 | [Original artwork](https://raw.githubusercontent.com/rustdesk/rustdesk/1297da6d186e58d9096be24072ae3998cdbbf8fe/res/mac-icon.png) |
| Snipaste | [`snipaste.svg`](../../public/tool-icons/snipaste.svg) | SVG, 512 viewBox | [Original artwork](https://www.snipaste.com/img/logo.svg) |
| Syncthing | [`syncthing.png`](../../public/tool-icons/syncthing.png) | 512 x 512 | [Original artwork](https://raw.githubusercontent.com/syncthing/syncthing/a4a2da477f32d29eda98cc6eb08554dfe5078875/assets/logo-512.png) |
| Typora | [`typora.png`](../../public/tool-icons/typora.png) | 256 x 256 | [Original artwork](https://typora.io/img/icon_256x256.png) |
| Ventoy | [`ventoy.png`](../../public/tool-icons/ventoy.png) | 512 x 512 | [Original artwork](https://raw.githubusercontent.com/ventoy/Ventoy/74cff34240dca6991b79c6656770670da7b0c39e/ICON/logo_512.png) |
| VLC | [`vlc.svg`](../../public/tool-icons/vlc.svg) | SVG, 512 viewBox | [Original artwork](https://raw.githubusercontent.com/videolan/vlc/d460ecd30f7eb4e2d866754a18f4c2eb3ded9aa3/extras/package/macosx/asset_sources/vlc_app_icon.svg) |

## Updating an icon

1. Inspect the official application or repository asset and choose a vector or a sufficiently large raster. Compare the artwork with the application launcher when available.
2. Save it in `public/tool-icons/`, update its card's `iconUrl` if the filename changes, and update this source record. Keep the source revision pinned for repository assets.
3. Run the icon asset and API tests, then verify catalogue and detail pages in desktop and mobile browsers.

Artwork retains the upstream projects' rights and licence terms. The downloaded files are preserved without redrawing or recolouring.

## Downloaded file checksums

```text
d7e6016dd11ff9ce48ed6f1f24d8090b85d70982a450f1f1e51943739e166a48  localsend.png
01492092f1aaad104d3d4fd535b35da7e2b3887d5fd3ca787744fa6156472ea9  maccy.png
044d3b64a14aa512ca41469372d1ad630557daaeb2cb4e709d34f2d3c57d4c3b  motrix.png
61061e12f63691031db57d82a9effad92de1ca0ccb49396bff77e69fa85258c1  obs-studio.png
90a0546a1ca67f7b1d3fd752873f91aab696d897ef0f1f84e7d6bdeb8093381e  openscreen.png
646e7dff07c199c2b71226e4efcebdb74e90d84ef6e9664d76dc7c50d94738ae  quota-float.png
6e1d783459bbb7093f3e3474e44fc6ed5e710f583d1586098b2dd86788f36347  rustdesk.png
26c1fcfde951e7af8dee825d26c215503b1c24ef7952367669022fcc7fae7552  snipaste.svg
d0275a171c811209fa5d39b5ccdf7504fc356e40144cb98cb1d85e2acd4793e7  syncthing.png
c11c7edf1b0d0814894db394df6b6fe9ad031bea12249e5dae51c2dd503922a0  typora.png
bc4864e7226f33c42a51c8df9660291ffacd66f03741485c946d07a06662dbcd  ventoy.png
e73bc8989d937571bd0c8b6af1ac242378fd020698a83cc64e7b850ccdfb1eb9  vlc.svg
```
