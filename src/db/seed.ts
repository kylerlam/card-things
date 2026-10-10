import type { CardThingsDatabase } from "./connection";
import { categories, downloadLinks, tags, tools, toolTags } from "./schema";

const categoryRows = [
  {
    id: "cat-capture",
    slug: "capture",
    name: "畫面與擷取",
    description: "截圖、錄屏與視覺整理。",
    sortOrder: 10,
  },
  {
    id: "cat-transfer",
    slug: "transfer",
    name: "檔案與同步",
    description: "在裝置與團隊之間安全移動檔案。",
    sortOrder: 20,
  },
  {
    id: "cat-system",
    slug: "system",
    name: "系統與安裝",
    description: "準備環境、啟動媒體與系統維護。",
    sortOrder: 30,
  },
] as const;

const tagRows = [
  { id: "tag-open", slug: "open-source", name: "開源" },
  { id: "tag-local", slug: "local-first", name: "本機優先" },
  { id: "tag-team", slug: "team-ready", name: "團隊協作" },
] as const;

const toolRows = [
  {
    id: "tool-framesnap",
    slug: "framesnap",
    name: "FrameSnap",
    summary: "快速擷取、標註與整理畫面片段。",
    description:
      "FrameSnap 是一個示例截圖工具，用來展示 CardThings 的工具介紹、平台資訊與下載來源結構。",
    categoryId: "cat-capture",
    status: "published" as const,
    platforms: JSON.stringify(["macOS", "Windows"]),
    version: "2.4",
    installation: "選擇對應平台的來源，下載後依系統提示完成安裝。",
    sourceLicense: "Example Community License",
    officialUrl: "https://example.com/framesnap",
    episodeUrl: "https://example.com/episodes/framesnap",
  },
  {
    id: "tool-relaydrop",
    slug: "relaydrop",
    name: "RelayDrop",
    summary: "在區域網絡內傳送檔案，不需建立帳號。",
    description:
      "RelayDrop 是安全的虛構示例內容，展示跨平台工具卡片與外部來源連結。",
    categoryId: "cat-transfer",
    status: "published" as const,
    platforms: JSON.stringify(["macOS", "Windows", "Android", "iOS"]),
    version: "1.8",
    installation: "開啟兩台裝置上的應用程式，確認接收端後開始傳送。",
    sourceLicense: "Example Open License",
    officialUrl: "https://example.com/relaydrop",
    episodeUrl: null,
  },
  {
    id: "tool-bootforge",
    slug: "bootforge",
    name: "BootForge",
    summary: "建立可重用的系統安裝媒體。",
    description:
      "BootForge 是虛構的系統工具示例，說明版本、安裝提示和多個取得來源。",
    categoryId: "cat-system",
    status: "published" as const,
    platforms: JSON.stringify(["Windows", "Linux"]),
    version: "3.1",
    installation: "請先備份目標磁碟；建立安裝媒體會清除其中的現有資料。",
    sourceLicense: "Example Source License",
    officialUrl: "https://example.com/bootforge",
    episodeUrl: "https://example.com/episodes/bootforge",
  },
  {
    id: "tool-labnote",
    slug: "labnote",
    name: "LabNote",
    summary: "尚未公開的草稿工具，用於驗證發布狀態。",
    description: "這筆虛構資料只應出現在管理後台。",
    categoryId: "cat-system",
    status: "draft" as const,
    platforms: JSON.stringify(["macOS"]),
    version: null,
    installation: null,
    sourceLicense: null,
    officialUrl: null,
    episodeUrl: null,
  },
] as const;

const toolTagRows = [
  { toolId: "tool-framesnap", tagId: "tag-local" },
  { toolId: "tool-relaydrop", tagId: "tag-open" },
  { toolId: "tool-relaydrop", tagId: "tag-local" },
  { toolId: "tool-bootforge", tagId: "tag-open" },
] as const;

const downloadRows = [
  {
    id: "download-framesnap-official",
    toolId: "tool-framesnap",
    label: "官方下載頁",
    provider: "Official",
    kind: "official" as const,
    platform: "macOS / Windows",
    url: "https://example.com/framesnap/download",
    sortOrder: 10,
  },
  {
    id: "download-framesnap-mirror",
    toolId: "tool-framesnap",
    label: "示例鏡像",
    provider: "Example Drive",
    kind: "mirror" as const,
    platform: "Windows",
    url: "https://example.com/mirrors/framesnap",
    sortOrder: 20,
  },
  {
    id: "download-relaydrop-official",
    toolId: "tool-relaydrop",
    label: "官方版本列表",
    provider: "Official",
    kind: "official" as const,
    platform: "All platforms",
    url: "https://example.com/relaydrop/releases",
    sortOrder: 10,
  },
  {
    id: "download-bootforge-official",
    toolId: "tool-bootforge",
    label: "官方下載頁",
    provider: "Official",
    kind: "official" as const,
    platform: "Windows / Linux",
    url: "https://example.com/bootforge/download",
    sortOrder: 10,
  },
] as const;

export function seedDatabase(database: CardThingsDatabase) {
  database.transaction((tx) => {
    tx.insert(categories).values([...categoryRows]).onConflictDoNothing().run();
    tx.insert(tags).values([...tagRows]).onConflictDoNothing().run();
    tx.insert(tools).values([...toolRows]).onConflictDoNothing().run();
    tx.insert(toolTags).values([...toolTagRows]).onConflictDoNothing().run();
    tx.insert(downloadLinks)
      .values([...downloadRows])
      .onConflictDoNothing()
      .run();
  });
}
