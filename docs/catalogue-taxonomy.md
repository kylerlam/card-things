# Catalogue taxonomy

Use broad purpose categories instead of creating a separate category for each narrowly defined tool. The owner's planning inventory suggests the following five groups; its examples guide classification and do not authorize publishing every listed application.

| Category | Slug | Purpose | Planning examples | Current status |
| --- | --- | --- | --- | --- |
| 效率與辦公 | `productivity` | Daily work, writing, and productivity aids | Maccy, Typora, Quota Float | Active: Maccy |
| 檔案與連線 | `files-network` | File transfer, downloads, synchronization, and remote connections | LocalSend, Motrix, Syncthing, RustDesk | Active: LocalSend |
| 影音與擷取 | `media-capture` | Screenshots, recording, streaming, and media playback | OBS Studio, OpenScreen, ScreenArc, Snipaste, VLC | Active: Snipaste |
| 開發與服務 | `development-services` | Development environments and hosted applications | FlyEnv, 小皮終端, Easy!Appointments, Halo | Inactive until a corresponding card is added |
| 系統與維護 | `system-maintenance` | Installation media and system maintenance | Ventoy, 騰訊檸檬清理 | Inactive until a corresponding card is added |

Keep only categories with published content in the current local preview. Updating its three existing categories should preserve their database IDs and card associations. The deployment content record is [catalogue.json](../deployments/local-preview/catalogue.json).

Choose one primary purpose category per card. Use tags for narrower capabilities such as clipboard history, screenshot annotation, synchronization, or remote control; platform and licensing information remain separate from the purpose hierarchy. No nested category structure is needed for the current collection.
