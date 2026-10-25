# Catalogue taxonomy

Use broad purpose categories instead of creating a separate category for each narrowly defined tool. The owner's confirmed planning inventory contains twelve applications across four active groups; development and services remains an inactive group for future corresponding content.

| Category | Slug | Purpose | Planning examples | Current status |
| --- | --- | --- | --- | --- |
| 效率與辦公 | `productivity` | Daily work, writing, and productivity aids | Maccy, Typora, Quota Float | Active: 3 cards |
| 檔案與連線 | `files-network` | File transfer, downloads, synchronization, and remote connections | LocalSend, Motrix, Syncthing, RustDesk | Active: 4 cards |
| 影音與擷取 | `media-capture` | Screenshots, recording, streaming, and media playback | OBS Studio, OpenScreen, Snipaste, VLC | Active: 4 cards |
| 開發與服務 | `development-services` | Development environments and hosted applications | — | Inactive until a corresponding card is added |
| 系統與維護 | `system-maintenance` | Installation media and system maintenance | Ventoy | Active: 1 card |

Keep only the four categories with published content in the current local preview. Category updates should preserve existing database IDs and card associations. The deployment content record is [catalogue.json](../deployments/local-preview/catalogue.json).

Choose one primary purpose category per card. Use tags for narrower capabilities such as clipboard history, screenshot annotation, synchronization, or remote control; platform and licensing information remain separate from the purpose hierarchy. No nested category structure is needed for the current collection.
