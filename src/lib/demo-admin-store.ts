"use client";

import { useSyncExternalStore } from "react";

export type DemoAdminCategory = {
  id: string;
  name: string;
  slug: string;
};

export type DemoAdminTag = {
  id: string;
  name: string;
  slug: string;
};

export type DemoAdminTool = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  categoryId: string;
  status: "draft" | "published";
  platforms: string[];
  version: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type DemoAdminState = {
  version: 1;
  signedIn: boolean;
  profile: {
    id: string;
    name: string;
    email: string;
  };
  categories: DemoAdminCategory[];
  tags: DemoAdminTag[];
  tools: DemoAdminTool[];
};

const storageKey = "cardthings-demo-admin-v1";
const listeners = new Set<() => void>();

export const initialDemoAdminState: DemoAdminState = {
  version: 1,
  signedIn: false,
  profile: {
    id: "CT-DEMO-ADMIN",
    name: "示例管理員",
    email: "demo.admin@example.test",
  },
  categories: [
    { id: "cat-capture", name: "畫面與擷取", slug: "capture" },
    { id: "cat-transfer", name: "檔案與同步", slug: "transfer" },
    { id: "cat-system", name: "系統與安裝", slug: "system" },
  ],
  tags: [
    { id: "tag-open", name: "開源", slug: "open-source" },
    { id: "tag-local", name: "本機優先", slug: "local-first" },
    { id: "tag-team", name: "團隊協作", slug: "team-ready" },
  ],
  tools: [
    {
      id: "tool-framesnap",
      name: "FrameSnap",
      slug: "framesnap",
      summary: "快速擷取、標註與整理畫面片段。",
      categoryId: "cat-capture",
      status: "published",
      platforms: ["macOS", "Windows"],
      version: "2.4",
      sourceLabel: "官方下載頁",
      sourceUrl: "https://example.com/framesnap/download",
    },
    {
      id: "tool-relaydrop",
      name: "RelayDrop",
      slug: "relaydrop",
      summary: "在區域網絡內傳送檔案，不需建立帳號。",
      categoryId: "cat-transfer",
      status: "published",
      platforms: ["macOS", "Windows", "Android", "iOS"],
      version: "1.8",
      sourceLabel: "官方版本列表",
      sourceUrl: "https://example.com/relaydrop/releases",
    },
    {
      id: "tool-bootforge",
      name: "BootForge",
      slug: "bootforge",
      summary: "建立可重用的系統安裝媒體。",
      categoryId: "cat-system",
      status: "published",
      platforms: ["Windows", "Linux"],
      version: "3.1",
      sourceLabel: "官方下載頁",
      sourceUrl: "https://example.com/bootforge/download",
    },
    {
      id: "tool-labnote",
      name: "LabNote",
      slug: "labnote",
      summary: "尚未公開的草稿工具，用於驗證發布狀態。",
      categoryId: "cat-system",
      status: "draft",
      platforms: ["macOS"],
      version: "",
      sourceLabel: "",
      sourceUrl: "",
    },
  ],
};

let state = initialDemoAdminState;
let loaded = false;

function cloneInitialState(): DemoAdminState {
  return structuredClone(initialDemoAdminState);
}

function loadState() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) {
      state = cloneInitialState();
      return;
    }
    const parsed = JSON.parse(stored) as DemoAdminState;
    state = parsed.version === 1 ? parsed : cloneInitialState();
  } catch {
    state = cloneInitialState();
  }
}

function subscribe(listener: () => void) {
  loadState();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  loadState();
  return state;
}

function getServerSnapshot() {
  return initialDemoAdminState;
}

function save(next: DemoAdminState) {
  state = next;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(storageKey, JSON.stringify(next));
  }
  listeners.forEach((listener) => listener());
}

export function useDemoAdmin() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function signInDemoAdmin() {
  loadState();
  save({ ...state, signedIn: true });
}

export function signOutDemoAdmin() {
  loadState();
  save({ ...state, signedIn: false });
}

export function resetDemoAdmin(signedIn = true) {
  const next = cloneInitialState();
  next.signedIn = signedIn;
  save(next);
}

export function saveDemoAdminTool(tool: DemoAdminTool) {
  loadState();
  const exists = state.tools.some((item) => item.id === tool.id);
  save({
    ...state,
    tools: exists
      ? state.tools.map((item) => (item.id === tool.id ? tool : item))
      : [...state.tools, tool],
  });
}

export function deleteDemoAdminTool(id: string) {
  loadState();
  save({ ...state, tools: state.tools.filter((item) => item.id !== id) });
}

export function saveDemoAdminCategory(category: DemoAdminCategory) {
  loadState();
  const exists = state.categories.some((item) => item.id === category.id);
  save({
    ...state,
    categories: exists
      ? state.categories.map((item) => (item.id === category.id ? category : item))
      : [...state.categories, category],
  });
}

export function deleteDemoAdminCategory(id: string) {
  loadState();
  if (state.tools.some((tool) => tool.categoryId === id)) return false;
  save({ ...state, categories: state.categories.filter((item) => item.id !== id) });
  return true;
}

export function saveDemoAdminTag(tag: DemoAdminTag) {
  loadState();
  const exists = state.tags.some((item) => item.id === tag.id);
  save({
    ...state,
    tags: exists
      ? state.tags.map((item) => (item.id === tag.id ? tag : item))
      : [...state.tags, tag],
  });
}

export function deleteDemoAdminTag(id: string) {
  loadState();
  save({ ...state, tags: state.tags.filter((item) => item.id !== id) });
}

export function updateDemoAdminProfile(profile: { name: string; email: string }) {
  loadState();
  save({ ...state, profile: { ...state.profile, ...profile } });
}
